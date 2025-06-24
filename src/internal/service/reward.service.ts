import { IReward } from "../../interface/entity/reward.entity.inteface";
import RewardRepository from "../../repository/reward.repository";
import { SreviceConstants } from "../../utils/constant.utils";
import logger from "../../utils/logger";

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



    public calculateRewardInDepositAmount(user_id: string, amount: number, currency: string) : DepositToReward {
        try {
            let modifiedDepositAmount : number = (amount / (1 + SreviceConstants.DEPOSIT_TAX_RATE));
            let rewardAmount = amount - modifiedDepositAmount;
            const res : DepositToReward = {
                depositAmount: amount,
                rewardAmount: rewardAmount,
                modifiedDepositAmount: modifiedDepositAmount
            }

            const rewardObj : IReward = {
                user_id: user_id,
                reward_id: 'REWARD-' + new Date().getTime(),
                reward_amount: rewardAmount,
                reward_status: 'ACTIVE',
                reward_date: new Date().getTime(),
                reward_currency: currency,
                reward_type: 'SIGNUP_REWARD',
                reward_description: 'NEW_USER_SIGNUP_REWARD',
                is_setteled: false
                
            }
            this.rewardRepository.createReward(rewardObj);
            return res;
        } catch (err) {
            logger.error('Error in calculating reward in deposit amount');
            throw new Error(`Error in calculating reward in deposit amount ${user_id}`)
        }
    }

    public async addnewReward(user_id: string, reward_amount: number, reward_currency: string, reward_type: string, reward_description?: string, reward_reference?: string) : Promise<Boolean> {
        try {

            const rewardObj : IReward = {
                user_id: user_id,
                reward_id: 'REWARD-' + new Date().getTime(),
                reward_amount: reward_amount,
                reward_status: 'ACTIVE',
                reward_date: new Date().getTime(),
                reward_currency: reward_currency,
                reward_type: reward_type,
                reward_description: reward_description,
                reward_reference: reward_reference,
                is_setteled: false
            }

            const result = this.rewardRepository.createReward(rewardObj);
            return !!result;
        } catch (err) {
            logger.error(`Error in adding new reward for user ${user_id}`);
            throw new Error(`Error in adding new reward for user ${user_id}`);
        }
    }

    public async markRewardAsSettled(reward_id: string) : Promise<Boolean> {
        try {
            const rewardObj : Partial<IReward> = {
                reward_id: reward_id,
                is_setteled: true
            }
            const result = this.rewardRepository.updateReward(reward_id, rewardObj);
            return !!result;
        } catch (err) {
            logger.error(`Error in marking reward as settled for reward ${reward_id}`);
            throw new Error(`Error in marking reward as settled for reward ${reward_id}`);
        }

    }
}

export default RewardService;