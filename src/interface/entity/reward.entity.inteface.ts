export enum RewardType {
    ADD_MONEY_REWARD, SIGNIN_REWARD
}

export enum RewardStatus {
    AVAILED, UNAVAILED
}

export interface IReward {
    user_id: string;
    reward_id: string;
    reward_type: RewardType | String;
    reward_amount: number;
    reward_currency: string;
    reward_status: string;
    reward_date: number;
    reward_description?: string;
    reward_reference?: string;
    is_setteled: boolean;
    created_at?: Date;
    updated_at?: Date;
}