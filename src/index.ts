// src/index.ts
import express, { NextFunction, Request, Response } from 'express';
import router from './routes';
import { connectDB } from './config/db.config'; // Import the connectDB function


const app = express();
const port = process.env.PORT || 3000;



app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript Backend!');
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Oops! The page you're looking for doesn't exist." });
});

app.use(router);


const startServer = async () => {
  try {
    console.log(`Server running at http://localhost:${port}`);

    await connectDB(); // Connect to MongoDB
    app.listen(port, () => {
      // Use logger here instead of console.log for consistency, or keep console.log if preferred for startup
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1); // Exit the application if there's an error starting the server
  }
};


startServer();