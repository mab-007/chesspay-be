export interface IUser {
    user_id: string;
    username: string;
    user_type: string;
    email: string;
    status: string;
    country: string;
    raiting_id?: string;
    user_phone?:string;
    password_hash?: string;
    first_name?: string;
    last_name?: string;
    auth_id?: string;
    date_of_birth?: number;
    profile_picture_url?: string;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
    last_login?: number;
  }