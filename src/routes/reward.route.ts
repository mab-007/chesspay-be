import { Router } from "express";
import logger from "../utils/logger";
import RewardService from "../internal/service/reward.service";
import RewardRepository from "../repository/reward.repository";

class RewardRoute {
    public router: Router;
    private rewardSvc: RewardService;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
        this.rewardSvc = new RewardService();
    }

    private initializeRoutes(): void {
        this.router.post('/init', async (req, res) : Promise<any> =>{
            try {
                const {user_id, reward_amount, currency, reward_type} = req.body;
                const result = this.rewardSvc.addnewReward(user_id, reward_amount, currency, reward_type);
                return res.status(200).json({
                    success: true,
                    data: result,
                    error: null
                })

            } catch (err) {
                logger.error(`Error in creating reward for user with req : ${JSON.stringify(req)}}`);
                return res.status(500).json({
                    success: false,
                    data: null,
                    error: err
                })
            }
        })
    }
}

export default RewardRoute;