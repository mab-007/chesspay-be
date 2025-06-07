import mongoose from "mongoose";
import { IFriends } from "../interface/entity/friends.entity.interface";


const friendsSchema = new mongoose.Schema<IFriends>({
    user_id: { type: String, required: true },
    friend_id: { type: String, required: true },
    friend_name: { type: String, required: true },
    friend_since: { type: Number, required: true },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const FriendsModel = mongoose.model<IFriends>('friends', friendsSchema);

export default FriendsModel;