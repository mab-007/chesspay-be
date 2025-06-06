import { Router, Request, Response } from 'express';
import logger from '../utils/logger'; // Import the logger

class PingRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/ping', (req: Request, res: Response) => {
        logger.info('Ping request received'); // Log the ping request
        res.status(200).send('pong');
    });
  }
}

export default PingRouter;