import mongoose from "mongoose";
import { IUser } from "../interface/entity/user.entity.interface";


const userSchema = new mongoose.Schema<IUser>({
    user_id: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    country: {
        type: String,
        required: true,
        default: 'Unknown',
    },
    password_hash: {
        type: String,
        required: false,
    },
    first_name: {
        type: String,
        required: false,
    },
    last_name: {
        type: String,
        required: false,
    },
    date_of_birth: {
        type: Date,
        required: false,
    },
    profile_picture_url: {
        type: String,
        required: false,
        default: '',
    },
    is_active: {
        type: Boolean,
        required: true,
        default: true,
    },
    last_login: {
        type: Number,
        required: false,
    },
}, {
    timestamps: true,
});

const UserModel = mongoose.model<IUser>('user', userSchema);

export default UserModel;