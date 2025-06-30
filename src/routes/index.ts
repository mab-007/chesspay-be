import express, { Router } from 'express';
import PingRouter from './ping.route';
import PaymentRoute from './payment.route';
import UserRouter from './user.route';
import RewardRoute from './reward.route';

const router = Router();
const pingRouter = new PingRouter();
const paymentRouter = new PaymentRoute();
const userRouter = new UserRouter();
const rewardRoute = new RewardRoute();

router.use('/api', pingRouter.router);
router.use('/payment', paymentRouter.router);
router.use('/users', userRouter.router)
router.use('/reward', rewardRoute.router)

export default router;