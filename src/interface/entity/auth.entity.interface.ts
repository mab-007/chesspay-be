export interface IAuth {
    user_id: string;
    supabase_id?: string;
    token?: string;
    token_expiry?: number;
    created_at?: Date;
}