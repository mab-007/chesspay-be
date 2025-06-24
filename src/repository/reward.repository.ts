import { Model } from "mongoose";
import RewardModel from "../entity/reward.entity";
import { IReward } from "../interface/entity/reward.entity.inteface";
import logger from "../utils/logger";

class RewardRepository {

    private rewardModel : Model<IReward>;

    constructor() {
        this.rewardModel = RewardModel;
    }


    public async createReward(reward: IReward): Promise<IReward> {
        try {
            return await this.rewardModel.create(reward);
        } catch (error) {
            logger.error(`Error creating reward for user_id ${reward.user_id}: ${error}`)
            throw new Error(`Error creating reward: ${error}`);
        }
    }

    public async getRewardById(rewardId: string): Promise<IReward | null> {
        try {
            return await this.rewardModel.findOne({ reward_id: rewardId }).exec();
        } catch (error) {
            logger.error(`Error getting reward by ID for ${rewardId}: ${error}`)
            throw new Error(`Error getting reward by ID: ${error}`);
        }
    }

    public async getRewardsByUserId(userId: string): Promise<IReward[]> {
        try {
            return await this.rewardModel.find({ user_id: userId }).exec();
        } catch (error) {
            logger.error(`Error getting rewards by user ID for ${userId}: ${error}`)
            throw new Error(`Error getting rewards by user ID: ${error}`);
        }
    }

    public async updateReward(rewardId: string, updates: Partial<IReward>): Promise<IReward | null> {
        try {
            return await this.rewardModel.findOneAndUpdate({ reward_id: rewardId }, { $set: updates }, { new: true }).exec();
        } catch (error) {
            logger.error(`Error updating reward with reward_id ${rewardId}: ${error}`)
            throw new Error(`Error updating reward: ${error}`);
        }
    }
}


export default RewardRepository;