export interface IFriends {
    user_id: string;
    friend_id: string;
    friend_name: string;
    friend_status: string; // e.g., 'pending', 'accepted', 'blocked'
    friend_since: Date;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}