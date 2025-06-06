export interface IFriends {
    user_id: string;
    friend_id: string;
    friend_name: string;
    friend_since: number;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}