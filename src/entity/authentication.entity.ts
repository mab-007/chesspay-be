import mongoose from "mongoose";
import { IAuthentication } from "../interface/entity/authentication.entity.interface";

const authenticationSchema = new mongoose.Schema<IAuthentication>({
    user_id: {
        type: String,
        required: true,
    },
    authentication_id: {
        type: String,
        required: true,
        unique: true,
    },
    authentication_type: {
        type: String,
        required: true,
    },
    authentication_token: {
        type: String,
        required: true,
    },
    authentication_expiry: {
        type: Number,
        required: true,
    },
    is_active: {
        type: Boolean,
        required: true,
        default: true,
    },
}, {
    timestamps: true,
});

const AuthenticationModel = mongoose.model<IAuthentication>('authentication', authenticationSchema);
export default AuthenticationModel;