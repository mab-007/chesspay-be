export interface ITransaction {
    user_id: string;
    transaction_id: string;
    account_id: string;
    transaction_type: string;
    transaction_amount: number;
    transaction_currency: string;
    transaction_status: string;
    transaction_date: Date;
    transaction_description?: string;
    transaction_fee?: number;
    transaction_reference?: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}