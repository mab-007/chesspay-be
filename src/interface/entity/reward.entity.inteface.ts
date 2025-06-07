export interface IReward {
    user_id: string;
    reward_id: string;
    reward_type: string;
    reward_amount: number;
    reward_currency: string;
    reward_status: string;
    reward_date: number;
    reward_description?: string;
    reward_reference?: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}