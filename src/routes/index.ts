import express, { Router } from 'express';
import PingRouter from './ping.route';

const router = Router();
const pingRouter = new PingRouter();

router.use('/', pingRouter.router);


export default router;