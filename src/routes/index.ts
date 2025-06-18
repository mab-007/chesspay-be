import express, { Router } from 'express';
import PingRouter from './ping.route';
import PaymentRoute from './payment.route';

const router = Router();
const pingRouter = new PingRouter();
const paymentRouter = new PaymentRoute();

router.use('/api', pingRouter.router);
router.use('/payment', paymentRouter.router);


export default router;