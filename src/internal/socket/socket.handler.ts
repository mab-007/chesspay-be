import { Server, Socket } from 'socket.io';
import logger from '../../utils/logger';
import GameService from '../service/game.service';
import { log } from 'console';

// Simple in-memory store for rooms and player assignments.
//TODO: For production, consider a more robust solution like Redis.
export interface Room {
  id: string;
  players: { socketId: string; username?: string; color?: 'white' | 'black' }[];
  boardState?: any; // Placeholder for your chess game state
  currentPlayerTurn?: string; // socketId of the player whose turn it is
}
export const rooms = new Map<string, Room>();

const matchmakingQueue: { socketId: string; username: string; preferences?: any }[] = [];


export default function initializeSocketIO(io: Server) {
  io.on('connection', (socket: Socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on('createRoom', ({ username }, callback: (response: { roomId?: string; error?: string }) => void) => {
      const roomId = `room-${Math.random().toString(36).substring(2, 9)}`;
      socket.join(roomId);
      const newRoom: Room = {
        id: roomId,
        players: [{ socketId: socket.id, username }],
      };
      rooms.set(roomId, newRoom);
      logger.info(`Room created: ${roomId} by ${socket.id} (${username})`);
      callback({ roomId });
    });

    socket.on('joinRoom', ({ roomId, username }, callback: (response: { status: string; message?: string; room?: Room }) => void) => {
      const room = rooms.get(roomId);
      if (room) {
        if (room.players.length < 2 && !room.players.find(p => p.socketId === socket.id)) {
          socket.join(roomId);
          room.players.push({ socketId: socket.id, username });
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
              // initialBoardState: ... // Send initial board state if managed server-side
            });
            logger.info(`Game started in room: ${roomId}`);
          }
          callback({ status: 'success', room });
        } else if (room.players.find(p => p.socketId === socket.id)) {
          callback({ status: 'error', message: 'You are already in this room.' });
        } else {
          callback({ status: 'error', message: 'Room is full.' });
        }
      } else {
        callback({ status: 'error', message: 'Room not found.' });
      }
    });

    socket.on('findMatch', async ({ username, preferences, userDetails, allowExtendedSearch }, callback) => {
      try{
        console.log({ username, preferences, userDetails, allowExtendedSearch });
        logger.info(`User ${socket.id} (${username}) looking for a match with preferences:`, preferences);
        if(!username || !preferences){
          logger.info('Username or Preference is missing');
          return callback({ status: 'error', message: 'Username or Preference is missing' })
        }
        const result : Boolean = await new GameService().matchMakingRealTime(socket, username, preferences, userDetails, allowExtendedSearch)
        if(result)
          return callback({ status: 'success', message: 'Added to queue, searching for opponent...' });
        else 
          return callback({ status: 'error', message: `Something went wrong in pushing ${username} to matchmaking queue` });
      } catch(err) {
        logger.error(`Error in finding match for ${username}: ${err}`);
        return callback({ status: 'error', message: `Something went wrong in finding match for ${username}`})
      }
    });

    socket.on('makeMove', ({ roomId, move }) => {
      console.log('HITTING MAKE MOVE'+roomId);
      
      const room = rooms.get(roomId);

      console.log('ROOM'+JSON.stringify(room));
      
      if (room && room.players.find(p => p.socketId === socket.id) && socket.id === room.currentPlayerTurn) {
        // Basic validation: is it the player's turn?
        // In a real game, you'd validate the move against chess rules and update boardState
        logger.info(`Move received in room ${roomId} from ${socket.id}: ${JSON.stringify(move)}`);

        // Switch turns
        const currentPlayerIndex = room.players.findIndex(p => p.socketId === room.currentPlayerTurn);
        room.currentPlayerTurn = room.players[(currentPlayerIndex + 1) % 2].socketId;

        // Broadcast the move to the other player in the room
        socket.to(roomId).emit('opponentMove', { move, nextPlayerTurn: room.currentPlayerTurn });
        //TODO: Push event to queue for db entry
      } else {
        logger.warn(`Invalid move attempt in room ${roomId} from ${socket.id}`);
        // Optionally, send an error back to the sender
        // socket.emit('moveError', { message: 'Not your turn or invalid room.' });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
      // Handle player disconnection: remove from rooms, notify other players, etc.
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          logger.info(`User ${socket.id} removed from room ${roomId}`);
          io.to(roomId).emit('playerLeft', { playerId: socket.id, message: `Player ${socket.id} has left the game.` });
          if (room.players.length < 2) {
            // Potentially end the game or mark it as abandoned
            logger.info(`Room ${roomId} now has less than 2 players. Game might be over.`);
          }
        }
      });
    });
  });
}