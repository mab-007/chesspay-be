export interface IUser {
    user_id: string;
    username: string;
    email: string;
    country: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
    date_of_birth?: Date;
    profile_picture_url?: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
    last_login?: number;
  }