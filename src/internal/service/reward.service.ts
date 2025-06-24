import { IReward } from "../../interface/entity/reward.entity.inteface";
import RewardRepository from "../../repository/reward.repository";
import { ServiceConstants } from "../../utils/constant.utils"; // Corrected typo SreviceConstants -> ServiceConstants
import logger from "../../utils/logger";
import { v4 as uuidv4 } from 'uuid'; // Using UUID for more reliable unique IDs

type DepositToReward = {
    depositAmount : number;
    rewardAmount : number;
    modifiedDepositAmount: number
}


class RewardService {

    private rewardRepository : RewardRepository;

    constructor(rewardRepository: RewardRepository) {
        this.rewardRepository = rewardRepository;
    }



    // This method performs DB writes, so it MUST be async and awaited by the caller.
    public async calculateRewardInDepositAmount(user_id: string, amount: number, currency: string) : Promise<DepositToReward> {
        try {
            // Rounding is crucial for financial calculations to avoid floating point inaccuracies.
            const modifiedDepositAmountRaw = (amount / (1 + ServiceConstants.DEPOSIT_TAX_RATE));
            const modifiedDepositAmount = Math.round(modifiedDepositAmountRaw * 100) / 100;
            const rewardAmount = Math.round((amount - modifiedDepositAmount) * 100) / 100;

            const res : DepositToReward = {
                depositAmount: amount,
                rewardAmount: rewardAmount,
                modifiedDepositAmount: modifiedDepositAmount
            }

            // Using a timestamp for a unique ID is unreliable and can cause collisions.
            const rewardObj : IReward = {
                user_id: user_id,
                reward_id: `REWARD-${uuidv4()}`,
                reward_amount: rewardAmount,
                reward_status: 'ACTIVE',
                reward_date: new Date().getTime(),
                reward_currency: currency,
                reward_type: 'DEPOSIT_REWARD',
                reward_description: 'REWARD_ON_DEPOSIT',
                is_setteled: false
            }
            // CRITICAL: The async `createReward` call must be awaited.
            await this.rewardRepository.createReward(rewardObj);
            return res;
        } catch (err) {
            logger.error(`Error calculating reward for user ${user_id}`, { error: err, amount });
            throw new Error(`Failed to calculate reward for user ${user_id}.`);
        }
    }

    public async addnewReward(user_id: string, reward_amount: number, reward_currency: string, reward_type: string, reward_description?: string, reward_reference?: string) : Promise<Boolean> {
        try {

            const rewardObj : IReward = {
                user_id: user_id,
                reward_id: `REWARD-${uuidv4()}`,
                reward_amount: reward_amount,
                reward_status: 'ACTIVE',
                reward_date: new Date().getTime(),
                reward_currency: reward_currency,
                reward_type: reward_type,
                reward_description: reward_description,
                reward_reference: reward_reference,
                is_setteled: false
            }

            // CRITICAL: Await the promise to get the actual result.
            const result = await this.rewardRepository.createReward(rewardObj);
            // `!!Promise` is always true. This now correctly checks if a result was returned.
            return !!result;
        } catch (err) {
            logger.error(`Error adding new reward for user ${user_id}`, { error: err });
            throw new Error(`Failed to add new reward for user ${user_id}.`);
        }
    }

    public async markRewardAsSettled(reward_id: string) : Promise<Boolean> {
        try {
            const updates : Partial<IReward> = {
                is_setteled: true
            }
            // CRITICAL: Await the promise to get the actual result.
            const result = await this.rewardRepository.updateReward(reward_id, updates);
            return !!result;
        } catch (err) {
            logger.error(`Error marking reward as settled for reward ${reward_id}`, { error: err });
            throw new Error(`Failed to mark reward as settled for reward ${reward_id}.`);
        }

    }
}

export default RewardService;