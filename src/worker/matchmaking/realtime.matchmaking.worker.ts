import { readFileSync } from "fs";
import path from 'path'; // For robust path resolution
import redisClient, { MATCHMAKING_QUEUE_KEY, ROOM_QUEUE_KEY } from "../../utils/redis.client"; // Import constant
import logger from "../../utils/logger"; // For logging
import { Room } from "../../internal/socket/socket.handler";

// export interface RaitingObj {
//     blitz: number;
//     rapid: number;
//     bullet: number;
//     puzzle: number
// }

export interface UserDetailsRedisObj {
    user_id: string; // Use lowercase primitive types
    rating: number;
    socket_id: string;
    win_percentage: number;
    black_win_percentage: number;
    white_win_percentage: number;
    game_type: string;
    // Add username if it's part of the details and needed for game setup
    username?: string;

}

// Define an interface for the expected successful match result
export interface LuaMatchedPair {
    player1Details: UserDetailsRedisObj;
    player2Details: UserDetailsRedisObj;
}

// --- Redis Room Management ---
const ROOM_KEY_PREFIX = 'room:';
const SOCKET_TO_ROOM_KEY_PREFIX = 'socket-room:';

class RealtimeMatchmaking {
    private LUA_SCRIPT: string;
    // Use the imported constant for the queue name
    private matchmakingQueueName: string = MATCHMAKING_QUEUE_KEY;
    private roomQueueName: string = ROOM_QUEUE_KEY;


    constructor() {
        try {
            // Use path.join for robust script path resolution, relative to the compiled JS file
            this.LUA_SCRIPT = readFileSync(path.join(__dirname, '../../script/find_match.script.lua'), 'utf8');
        } catch (error) {
            logger.error("Failed to read Lua script for RealtimeMatchmaking:", error);
            throw new Error("Could not initialize RealtimeMatchmaking: Lua script missing or unreadable.");
        }
    }


    // Return type should reflect the actual outcome: a matched pair or null
    public async findMatch(userDetails: UserDetailsRedisObj, allowExtendedSearch: boolean = false): Promise<LuaMatchedPair | null> {
        try {
            // Add a guard clause to ensure game_type is present.
            if (!userDetails.game_type) {
                logger.error(`Matchmaking request for user ${userDetails.user_id} is missing 'game_type'. Aborting match find.`);
                return null;
            }

            // Create a game-type-specific queue key to ensure players are matched only within the same game mode.
            const gameTypeQueueKey = `${this.matchmakingQueueName}:${userDetails.game_type}`;
            const userDetailsString = JSON.stringify(userDetails); // Serialize the object
            // Explicitly cast the result based on your Lua script's known return types
            const result : string[] | any | null = await redisClient.eval(
                this.LUA_SCRIPT,
                1, // Number of keys
                gameTypeQueueKey,              // KEYS[1] - Use the specific queue for the game type
                userDetails.rating.toString(), // ARGV[1]
                userDetailsString,             // ARGV[2]
                "50",                          // ARGV[3] - example tolerance, make configurable
                allowExtendedSearch ? 'true' : 'false' // ARGV[4]
            );
            console.log('Result from Lua: '+result);
            if (result) {
                logger.info(`Match found via Lua for user ${userDetails.user_id}!`);
                const [player1Details, player2Details] = result;
                // Parse the JSON strings back into objects
                return {
                    player1Details: JSON.parse(player1Details) as UserDetailsRedisObj,
                    player2Details: JSON.parse(player2Details) as UserDetailsRedisObj
                };
            } else {
                logger.info(`No immediate match for user ${userDetails.user_id}. Player added to Lua queue.`);
                return null;
            }
        } catch(err) {
            logger.error(`Error in RealtimeMatchmaking findMatch for user ${userDetails.user_id}:`, err);
            return null; // Return null on error to indicate no match
        }
    }

    public async getRoom(roomId: string): Promise<Room | null> {
        const roomData = await redisClient.get(`${ROOM_KEY_PREFIX}${roomId}`);
        if (!roomData) return null;
        try {
            return JSON.parse(roomData) as Room;
        } catch (error) {
            logger.error(`Error parsing room data for room ${roomId}`, { error });
            return null;
        }
    }

    public async saveRoom(room: Room): Promise<void> {
        const pipeline = redisClient.pipeline();
        pipeline.set(`${ROOM_KEY_PREFIX}${room.id}`, JSON.stringify(room));
        room.players.forEach(player => {
            pipeline.set(`${SOCKET_TO_ROOM_KEY_PREFIX}${player.socketId}`, room.id);
        });
        await pipeline.exec();
        logger.info(`Room ${room.id} saved to Redis.`);
    }


    public async deleteRoom(roomId: string): Promise<void> {
        const room = await this.getRoom(roomId);
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

    public async getRoomIdForSocket(socketId: string): Promise<string | null> {
        return redisClient.get(`${SOCKET_TO_ROOM_KEY_PREFIX}${socketId}`);
    }
    
}


export default RealtimeMatchmaking;