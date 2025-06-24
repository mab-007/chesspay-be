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
        this.rewardSvc = new RewardService(new RewardRepository());
    }

    private initializeRoutes(): void {
        // Define reward-related routes here
        // init reward
        this.router.get('/init', async (req, res) : Promise<any> =>{
            try {
                const {user_id, amount, currency} = req.body;
                const result = this.rewardSvc.calculateRewardInDepositAmount(user_id, amount, currency);
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
        //Update Reward balance
        
        //get reward balance
    }
}

export default RewardRoute;