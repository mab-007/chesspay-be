import Redis from 'ioredis';
import logger from './logger';
import { redisConfig } from '../config/env.config';

const redisClient = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  username: redisConfig.username, // Add this line
  password: redisConfig.password,
  maxRetriesPerRequest: null, // Important for robust connection handling
  enableReadyCheck: true,
  lazyConnect: true, // Add this line to prevent auto-connecting
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis successfully.');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
  // Potentially exit or implement more sophisticated retry/fallback logic
});

export const MATCHMAKING_QUEUE_KEY = 'matchmaking_sortedset_queue';
export const ROOM_QUEUE_KEY = 'room_queue';


export const addUserToMatchmakingQueue = async (userId: string, username: string, parameters: any): Promise<void> => {
  const userData = JSON.stringify({ userId, username, parameters, timestamp: Date.now() });
  await redisClient.rpush(MATCHMAKING_QUEUE_KEY, userData);
  logger.info(`User ${username} (${userId}) added to matchmaking queue.`);
};

export default redisClient;
