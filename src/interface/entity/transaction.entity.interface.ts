export interface ITransaction {
    user_id: string;
    transaction_id: string;
    account_id: string;
    transaction_type: string;
    transaction_amount: number;
    transaction_currency: string;
    transaction_status: string;
    transaction_date: number;
    transaction_description?: string;
    transaction_fee?: number;
    transaction_reference?: string;
    transaction_reward?: number;
    reward_id?: string
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}