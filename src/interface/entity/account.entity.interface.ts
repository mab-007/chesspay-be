export interface IAccount {
    user_id: string;
    account_id: string;
    account_type: string;
    account_balance: number;
    currency: string;
    is_active: boolean;
    account_withdrawal_limit: number;
}