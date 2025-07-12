import express, { Router } from 'express';
import PingRouter from './ping.route';
import PaymentRoute from './payment.route';
import UserRouter from './user.route';
import RewardRoute from './reward.route';
import { authMiddleware } from '../middleware/auth.middleware';
import AuthRoute from './auth.route';
import AccountRoute from './account.route';
import GameRoute from './game.route';

const router = Router();
const pingRouter = new PingRouter();
const paymentRouter = new PaymentRoute();
const userRouter = new UserRouter();
const rewardRoute = new RewardRoute();
const authRouter = new AuthRoute();
const accountRouter = new AccountRoute();
const gaemRouter = new GameRoute();

// Public route, no authentication needed
router.use('/api', pingRouter.router);

// Protected routes: all routes under these paths will now require a valid token.
// The authMiddleware will run before any specific route handler in these routers.
router.use('/payment', authMiddleware, paymentRouter.router);
router.use('/users', authMiddleware, userRouter.router);
router.use('/reward', authMiddleware, rewardRoute.router);
router.use('/auth', authMiddleware, authRouter.router);
router.use('/account', authMiddleware, accountRouter.router);
router.use('/game', authMiddleware, gaemRouter.router);

export default router;