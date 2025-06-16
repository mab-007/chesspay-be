import { readFileSync } from "fs";
import path from 'path'; // For robust path resolution
import redisClient, { MATCHMAKING_QUEUE_KEY } from "../../utils/redis.client"; // Import constant
import logger from "../../utils/logger"; // For logging

interface UserDetailsRedisObj {
    user_id: string; // Use lowercase primitive types
    rating: number;
    win_percentage: number;
    black_win_percentage: number;
    white_win_percentage: number;
    // Add username if it's part of the details and needed for game setup
    username?: string;
}

// Define an interface for the expected successful match result
export interface LuaMatchedPair {
    player1Details: UserDetailsRedisObj;
    player2Details: UserDetailsRedisObj;
}


class RealtimeMatchmaking {
    private LUA_SCRIPT: string;
    // Use the imported constant for the queue name
    private queueName: string = MATCHMAKING_QUEUE_KEY;

    constructor() {
        try {
            // Use path.join for robust script path resolution, relative to the compiled JS file
            this.LUA_SCRIPT = readFileSync(path.join(__dirname, '../../script/final_match.script.lua'), 'utf8');
        } catch (error) {
            logger.error("Failed to read Lua script for RealtimeMatchmaking:", error);
            throw new Error("Could not initialize RealtimeMatchmaking: Lua script missing or unreadable.");
        }
    }


    // Return type should reflect the actual outcome: a matched pair or null
    public async findMatch(userDetails: UserDetailsRedisObj, allowExtendedSearch: boolean = false): Promise<LuaMatchedPair | null> {
        try {
            const userDetailsString = JSON.stringify(userDetails); // Serialize the object
            // Explicitly cast the result based on your Lua script's known return types
            const result : string[] | any | null = await redisClient.eval(
                this.LUA_SCRIPT,
                1, // Number of keys
                this.queueName, // KEYS[1] - queueName is already a string
                userDetails.rating.toString(), // ARGV[1]
                userDetailsString,             // ARGV[2]
                "50",                          // ARGV[3] - example tolerance, make configurable
                allowExtendedSearch ? 'true' : 'false' // ARGV[4]
            );

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
}


export default RealtimeMatchmaking;