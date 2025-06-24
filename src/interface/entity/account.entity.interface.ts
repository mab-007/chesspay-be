export interface IAccount {
    user_id: string;
    account_id: string;
    account_status: string;
    account_balance: number;
    reward_amount_balance: number;
    currency: string;
    is_active: boolean;
    account_withdrawal_limit: number;
}