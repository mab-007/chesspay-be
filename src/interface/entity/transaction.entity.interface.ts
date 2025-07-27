export interface ITransaction {
    user_id: string;
    transaction_id: string;
    account_id: string;
    transaction_type: TransactionType | String;
    transaction_nature: String;
    topup_amount: number;
    transaction_amount: number;
    transaction_currency: Currency | String;
    transaction_status: TransactionStatus | String;
    transaction_date: number;
    order_id?: string;
    transaction_description?: string;
    transaction_fee?: number;
    transaction_reference?: string;
    transaction_reward?: number;
    reward_id?: string
    is_active: boolean;
    rzp_metadata?: Object;
    created_at?: Date;
    updated_at?: Date;
}

export enum TransactionType {
    ADD_MONEY, WITHDRAWAL, GAME_MONEY
}

export enum Currency {
    INR, USD
}

export enum TransactionStatus {
    IN_PROGRESS, ORDER_IN_PROGRESSS, SUCCESSFUL, FAILED
}