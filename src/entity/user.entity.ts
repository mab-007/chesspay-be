import mongoose from "mongoose";
import { IUser } from "../interface/entity/user.entity.interface";


const userSchema = new mongoose.Schema<IUser>({
    user_id: {
        type: String,
        required: true,
        index: true, // Explicitly create an index for faster queries on user_id
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true, // Removes whitespace from both ends of the string
    },
    user_type: {
        type: String,
        required: true,
    },
    auth_id: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true, // Removes whitespace from both ends of the string
        lowercase: true, // Ensures email uniqueness is case-insensitive
    },
    status: {
        type: String,
        required: true,
        default: 'ACTIVE',
    },
    country: {
        type: String,
        required: true,
        default: 'Unknown',
    },
    user_phone: {
        type: String,
        required: false,
    },
    raiting_id: {
        type: String,
        required: false,
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
        type: Number,
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