// src/index.ts
import express, { NextFunction, Request, Response } from 'express';
import router from './routes';
import { connectDB } from './config/db.config'; // Import the connectDB function
import { Server as SocketIOServer } from 'socket.io';
import http from 'http'; // Still needed if you want a fallback or for other purposes
import initializeSocketIO from './internal/socket/socket.handler';
import logger from './utils/logger';
import redisClient from './utils/redis.client';
import cors from 'cors'; // Import the cors middleware
import { GameUpdateSqsWorker } from './worker/matchmaking/gameudpate.sqs.worker';


const app = express();
const port = process.env.PORT || 3000;

let httpServer: http.Server = http.createServer(app);
export const io = new SocketIOServer(httpServer, { // Initialize Socket.IO server
  cors: {
    origin: "*", // Configure CORS for Socket.IO, adjust as needed for your UI's origin
    methods: ["GET", "POST"]
  }
});

// Enable CORS for all routes
app.use(cors()); // You can configure this further if needed, e.g., app.use(cors({ origin: 'http://your-frontend-domain.com' }))



// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript Backend!');
});


app.use(router);
// Catch-all for undefined API routes (must be after app.use(router))
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.route) { // If no route was matched by Express router
    res.status(404).json({ message: "Oops! The API endpoint you're looking for doesn't exist." });
  } else {
    next();
  }
});


const startServer = async () => {
  try {
    console.log(`Server running at http://localhost:${port}`);
    await connectDB(); // Connect to MongoDB
    initializeSocketIO(io); // Initialize Socket.IO with the server instance

    await redisClient.connect(); // Connect to Redis
    logger.info('Initializing background workers...');
    const gameUpdateWorker = new GameUpdateSqsWorker();
    gameUpdateWorker.start();

    // await initializeGlobalSocketServer();
    httpServer.listen(port, () => {
      // Use logger here instead of console.log for consistency, or keep console.log if preferred for startup
      logger.info(`Server running at http://localhost:${port}`);
    });
    // app.listen(port, () => {
    //   // Use logger here instead of console.log for consistency, or keep console.log if preferred for startup
    //   console.log(`Server running at http://localhost:${port}`);
    // });
  } catch (error) {
    logger.error('Error starting the server:', error);
    process.exit(1); // Exit the application if there's an error starting the server
  }
};

const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  // Stop the server from accepting new connections
  httpServer.close(err => {
    if (err) {
      logger.error('Error closing HTTP server:', err);
      process.exit(1);
    }
    logger.info('HTTP server closed.');

    // Disconnect from Redis
    redisClient.quit(() => {
      logger.info('Redis client disconnected.');
      // Now that all connections are closed, exit the process
      process.exit(0);
    });
  });

  // Force shutdown if graceful shutdown fails after a timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcing shutdown.');
    process.exit(1);
  }, 10000); // 10 seconds
};

startServer();

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));