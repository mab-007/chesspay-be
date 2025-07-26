import { Server, Socket } from 'socket.io';
import logger from '../../utils/logger';
import GameService from '../service/game.service';
import redisClient from '../../utils/redis.client';
import { IGame } from '../../interface/entity/game.entity.interface';

export interface Room {
  id: string;
  players: { socketId: string; user_id:string; username?: string; color?: 'white' | 'black', isConnected?: boolean }[];
  boardState?: any; // Placeholder for your chess game state
  currentPlayerTurn?: string; // socketId of the player whose turn it is
  gameResultPoints?: any;
  blackMovesArray: Array<string>;
  whiteMovesArray: Array<string>;
}

// --- Reconnection Logic ---
const disconnectionTimeouts = new Map<string, NodeJS.Timeout>();
const RECONNECTION_TIMEOUT_MS = 30000; // 30 seconds

// --- Redis Room Management ---
const ROOM_KEY_PREFIX = 'room:';
const SOCKET_TO_ROOM_KEY_PREFIX = 'socket-room:';

/**
 * Retrieves a room from Redis by its ID.
 * @param roomId The ID of the room.
 * @returns A Promise that resolves to the Room object or null if not found.
 */
export async function getRoom(roomId: string): Promise<Room | null> {
  const roomData = await redisClient.get(`${ROOM_KEY_PREFIX}${roomId}`);
  if (!roomData) return null;
  try {
    return JSON.parse(roomData) as Room;
  } catch (error) {
    logger.error(`Error parsing room data for room ${roomId}`, { error });
    return null;
  }
}

/**
 * Saves a room to Redis and maps the players' socket IDs to the room ID.
 * @param room The room object to save.
 */
export async function saveRoom(room: Room): Promise<void> {
  const pipeline = redisClient.pipeline();
  pipeline.set(`${ROOM_KEY_PREFIX}${room.id}`, JSON.stringify(room));
  room.players.forEach(player => {
    pipeline.set(`${SOCKET_TO_ROOM_KEY_PREFIX}${player.socketId}`, room.id);
  });
  await pipeline.exec();
  logger.info(`Room ${room.id} saved to Redis.`);
}

export async function saveTournamentRoom(room: any): Promise<void> {
  const pipeline = redisClient.pipeline();
  pipeline.set(`${ROOM_KEY_PREFIX}${room.id}`, JSON.stringify(room));
  await pipeline.exec();
  logger.info(`Room ${room.id} saved to Redis.`);
}

/**
 * Deletes a room from Redis, including all associated socket ID mappings.
 * @param roomId The ID of the room to delete.
 */
async function deleteRoom(roomId: string): Promise<void> {
  const room = await getRoom(roomId);
  if (room) {
    const pipeline = redisClient.pipeline();
    pipeline.del(`${ROOM_KEY_PREFIX}${roomId}`);
    room.players.forEach(player => {
      pipeline.del(`${SOCKET_TO_ROOM_KEY_PREFIX}${player.socketId}`);
    });
    await pipeline.exec();
    logger.info(`Room ${roomId} deleted from Redis.`);
  }
}

/**
 * Finds the room ID associated with a given socket ID.
 * @param socketId The socket ID of the player.
 * @returns A Promise that resolves to the room ID or null if not found.
 */
async function getRoomIdForSocket(socketId: string): Promise<string | null> {
  return redisClient.get(`${SOCKET_TO_ROOM_KEY_PREFIX}${socketId}`);
}

/**
 * Removes a player from a room and unmaps their socket ID.
 * If the room becomes empty, it is deleted.
 * @param socketId The socket ID of the player to remove.
 * @param roomId The ID of the room they are in.
 * @returns The updated room state before the player was removed, or null if room not found.
 */
async function removePlayerFromRoom(socketId: string, roomId: string): Promise<Room | null> {
    const room = await getRoom(roomId);
    if (!room) return null;

    const originalRoomState = { ...room, players: [...room.players] }; // Deep copy for return
    const playerIndex = room.players.findIndex(p => p.socketId === socketId);

    if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        const pipeline = redisClient.pipeline();
        pipeline.del(`${SOCKET_TO_ROOM_KEY_PREFIX}${socketId}`);

        if (room.players.length > 0) {
            pipeline.set(`${ROOM_KEY_PREFIX}${roomId}`, JSON.stringify(room));
            logger.info(`Player ${socketId} removed from room ${roomId}. Room updated.`);
        } else {
            pipeline.del(`${ROOM_KEY_PREFIX}${roomId}`);
            logger.info(`Player ${socketId} removed from room ${roomId}. Room was empty and is now deleted.`);
        }
        await pipeline.exec();
        return originalRoomState;
    }
    return room; // Player wasn't in the room, return current state
}


async function markPlayerDisconnected(socketId: string, roomId: string): Promise<{ room: Room; player: { socketId: string; username?: string; color?: 'white' | 'black', isConnected?: boolean } } | null> {
  const room = await getRoom(roomId);
  if (!room) return null;
  
  const player = room.players.find(p => p.socketId === socketId);

  if (player) {
    player.isConnected = false;
    // We don't delete the socket-to-room mapping yet, as the player might reconnect.
    // The mapping will be updated upon reconnection or deleted when the room is deleted.
    await saveRoom(room);
    logger.info(`Player ${player.username} (${socketId}) marked as disconnected in room ${roomId}.`);
    return { room, player };
  }

  return null;
}

export default function initializeSocketIO(io: Server) {
  io.on('connection', (socket: Socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on('createRoom', async ({ username, user_id }, callback: (response: { roomId?: string; error?: string }) => void) => {
      try {
        const roomId = `room-${Math.random().toString(36).substring(2, 9)}`;
        socket.join(roomId);
        const newRoom: Room = {
          id: roomId,
          players: [{ socketId: socket.id, user_id: user_id, username, isConnected: true }],
          blackMovesArray: [],
          whiteMovesArray: []
        };
        await saveRoom(newRoom);
        logger.info(`Room created: ${roomId} by ${socket.id} (${username})`);
        callback({ roomId });
      } catch (error) {
        logger.error(`Error creating room for user ${username} (${socket.id})`, { error });
        callback({ error: 'Failed to create room on the server.' });
      }
    });

    socket.on('joinRoom', async ({ roomId, user_id, username }, callback: (response: { status: string; message?: string; room?: Room }) => void) => {
      try {
        const room = await getRoom(roomId);
        if (room) {
          const disconnectedPlayer = room.players.find(p => p.username === username && !p.isConnected);
          if (disconnectedPlayer) {
              logger.info(`Player ${username} (${socket.id}) is attempting to reconnect to room ${roomId}.`);
              // Clear any pending abandonment timeout
              const timeoutKey = `${roomId}-${disconnectedPlayer.username}`;
              if (disconnectionTimeouts.has(timeoutKey)) {
                clearTimeout(disconnectionTimeouts.get(timeoutKey)!);
                disconnectionTimeouts.delete(timeoutKey);
                logger.info(`Cleared abandonment timeout for ${username} in room ${roomId}.`);
              }

              // Update player's details with the new socket ID and connection status
              const oldSocketId = disconnectedPlayer.socketId;
              disconnectedPlayer.socketId = socket.id;
              disconnectedPlayer.isConnected = true;

              // Update the socket-to-room mapping in Redis
              const pipeline = redisClient.pipeline();
              pipeline.del(`${SOCKET_TO_ROOM_KEY_PREFIX}${oldSocketId}`);
              pipeline.set(`${SOCKET_TO_ROOM_KEY_PREFIX}${socket.id}`, roomId);
              await pipeline.exec();

              socket.join(roomId);
              await saveRoom(room);// Notify both players that the game is resuming
              io.to(roomId).emit('gameResume', {
                message: `Player ${username} has reconnected. The game resumes.`,
                room,
              });

              callback({ status: 'success', message: 'Reconnected successfully.', room });
              return; // Exit early as the main logic is done
            }

          if (room.players.length < 2 && !room.players.find(p => p.socketId === socket.id)) {
            socket.join(roomId);
            room.players.push({ socketId: socket.id, user_id, username, isConnected: true });
            logger.info(`User ${socket.id} (${username}) joined room: ${roomId}`);

            if (room.players.length === 2) {
              // Assign colors (e.g., first player is white)
              room.players[0].color = 'white';
              room.players[1].color = 'black';
              room.currentPlayerTurn = room.players[0].socketId; // White starts

              io.to(roomId).emit('gameStart', {
                roomId,
                players: room.players.map(p => ({ id: p.socketId, username: p.username, color: p.color })),
                currentPlayerTurn: room.currentPlayerTurn,
                room
                // initialBoardState: ... // Send initial board state if managed server-side
              });
              logger.info(`Game started in room: ${roomId}`);
            }
            await saveRoom(room); // Save the updated room state
            callback({ status: 'success', room });
          } else if (room.players.find(p => p.socketId === socket.id)) {
            callback({ status: 'error', message: 'You are already in this room.' });
          } else {
            callback({ status: 'error', message: 'Room is full.' });
          }
        } else {
          callback({ status: 'error', message: 'Room not found.' });
        }
      } catch (error) {
        logger.error(`Error joining room ${roomId} for user ${username} (${socket.id})`, { error });
        callback({ status: 'error', message: 'Failed to join room on the server.' });
      }
    });

    socket.on('findMatch', async ({ username, preferences, gameAmount, findMatchUserDetailsObj, allowExtendedSearch }, callback) => {
      try{
        // If the user is already in a room, remove them and dissolve the room before finding a new match.
        const existingRoomId = await getRoomIdForSocket(socket.id);

        if (existingRoomId) {
          logger.info(`Player ${socket.id} is leaving existing room ${existingRoomId} to find a new match.`);
          // Notify other players in the room that this player has left.
          socket.to(existingRoomId).emit('playerLeft', {
            playerId: socket.id,
            message: `Opponent has left to find a new match. The game is abandoned.`
          });
          // Cleanly make all sockets leave the socket.io room grouping
          io.in(existingRoomId).socketsLeave(existingRoomId);
          await deleteRoom(existingRoomId);
        }

        console.log({ username, preferences, gameAmount, findMatchUserDetailsObj, allowExtendedSearch });
        logger.info(`User ${socket.id} (${username}) looking for a match with preferences:`, preferences);
        if(!username || !preferences || !findMatchUserDetailsObj.user_id){
          logger.info('Username or Preference is missing');
          return callback({ status: 'error', message: 'Username or Preference is missing' })
        }
        const result : IGame | null = await new GameService().matchMakingRealTime(socket, username, preferences, gameAmount, findMatchUserDetailsObj, allowExtendedSearch)
        if(result)
          return callback({ status: 'success', message: 'Added to queue, searching for opponent...', gameObj: result });
        else 
          return callback({ status: 'error', message: `Something went wrong in pushing ${username} to matchmaking queue` });
      } catch(err) {
        logger.error(`Error in finding match for ${username}: ${err}`);
        return callback({ status: 'error', message: `Something went wrong in finding match for ${username}`})
      }
    });

    //socket.emit('gameOver', { roomId, reason, winnerId, loserId });

    socket.on('gameOver', async ({ roomId, reason, winnerId, loserId }) => {
      try {
        logger.info(`Game over in room ${roomId}`);
        const room = await getRoom(roomId);
        if (room) {
          // The winner/loser logic seems incomplete, but we'll preserve it.
          const winner = room.players.find(p => p.socketId === winnerId);
          const loser = room.players.find(p => p.socketId === loserId);
          if (winner && loser) {
            // Business logic for after finding winner/loser can go here.
          }

          io.to(roomId).emit('gameEnded', {
            reason,
            winnerId,
            loserId
          });
          logger.info(`Game ended in room ${roomId}. Deleting room.`);
          //TODO: Push event to queue for db entry
          await deleteRoom(roomId);
        } else {
          logger.warn(`'gameOver' event received for a non-existent room: ${roomId}`);
        }
      } catch (error) {
        logger.error(`Error processing 'gameOver' for room ${roomId}`, { error });
      }
    })


    socket.on('makeMove', async ({ roomId, move, color }) => {
      try {
        const room = await getRoom(roomId);
        
        if (room && room.players.find(p => p.socketId === socket.id) && socket.id === room.currentPlayerTurn) {
          // Basic validation: is it the player's turn?
          // In a real game, you'd validate the move against chess rules and update boardState
          const p = room.players.find(p => p.socketId === socket.id)
          logger.info(`Move received in room ${roomId} from ${socket.id} with color ${color}: ${JSON.stringify(move)}`);

          // Switch turns
          const currentPlayerIndex = room.players.findIndex(p => p.socketId === room.currentPlayerTurn);
          room.currentPlayerTurn = room.players[(currentPlayerIndex + 1) % 2].socketId;
          console.log(room.whiteMovesArray)
          if(p && p.color === 'white')
            room.whiteMovesArray.push(move.to);
          else
            room.blackMovesArray.push(move.to);

          // Persist the change to Redis
          await saveRoom(room);

          // Broadcast the move to the other player in the room
          socket.to(roomId).emit('opponentMove', { move, nextPlayerTurn: room.currentPlayerTurn, room });
          //TODO: Push event to queue for db entry
        } else {
          logger.warn(`Invalid move attempt in room ${roomId} from ${socket.id}`);
          // Optionally, send an error back to the sender
          socket.emit('moveError', { message: 'Not your turn or invalid room.' });
        }
      } catch (error) {
        logger.error(`Error processing 'makeMove' in room ${roomId}`, { error });
      }
    });

    socket.on('disconnect', async () => {
      try {
        logger.info(`User disconnected: ${socket.id}`);
        // Find which room the user was in
        const roomId = await getRoomIdForSocket(socket.id);

        if (roomId) {
          // Remove the player from the room. This function also handles deleting the room if it becomes empty.
         const result = await markPlayerDisconnected(socket.id, roomId);

          // Only start a timeout if a player was successfully marked as disconnected in a 2-player game
          if (result && result.room.players.length === 2) {
            const { room, player: disconnectedPlayer } = result;

            logger.info(`Player ${disconnectedPlayer.username} disconnected from room ${roomId}. Starting ${RECONNECTION_TIMEOUT_MS / 1000}s timer.`);

            // Notify the remaining player that their opponent has disconnected
            io.to(roomId).emit('opponentDisconnected', {
              playerId: disconnectedPlayer.socketId,
              username: disconnectedPlayer.username,
              message: `Opponent ${disconnectedPlayer.username} has disconnected. They have ${RECONNECTION_TIMEOUT_MS / 1000} seconds to reconnect.`,
              timeout: RECONNECTION_TIMEOUT_MS,
            });

            // Set a timeout to abandon the game if the player doesn't reconnect
            const timeoutKey = `${roomId}-${disconnectedPlayer.username}`;
            const timeout = setTimeout(async () => {
              try {
                // Re-fetch the room to check the latest state
                const currentRoomState = await getRoom(roomId);
                const playerInQuestion = currentRoomState?.players.find(p => p.username === disconnectedPlayer.username);

                // If the room still exists and the player is still marked as disconnected, they lose.
                if (currentRoomState && playerInQuestion && !playerInQuestion.isConnected) {
                  logger.info(`Reconnection timeout for ${disconnectedPlayer.username} in room ${roomId} expired. Game abandoned.`);
                  
                  const winner = currentRoomState.players.find(p => p.username !== disconnectedPlayer.username);
                  
                  if (winner) {
                    io.to(roomId).emit('gameOver', {
                      reason: 'abandonment',
                      winnerId: winner.socketId,
                      loserId: playerInQuestion.socketId,
                      message: `Opponent failed to reconnect. You win by abandonment.`
                    });
                  }
                  
                  // Clean up the abandoned game room
                  await deleteRoom(roomId);
                }
              } catch (err) {
                logger.error(`Error in disconnection timeout for room ${roomId}`, { error: err });
              } finally {
                // Always clear the timeout from our map
                disconnectionTimeouts.delete(timeoutKey);
              }
            }, RECONNECTION_TIMEOUT_MS);

            disconnectionTimeouts.set(timeoutKey, timeout);
          } else if (result) {
            // If a player disconnects from a room that isn't a full 2-player game (e.g., waiting lobby), just delete it.
            logger.info(`Player disconnected from a non-full room ${roomId}. Deleting room.`);
            await deleteRoom(roomId);
          }
        }
      } catch (error) {
        logger.error(`Error handling disconnect for socket ${socket.id}`, { error });
      }
    });
  });
}