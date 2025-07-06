import mongoose from "mongoose";
import { IAuth } from "../interface/entity/auth.entity.interface";

const authSchema = new mongoose.Schema<IAuth>({
    user_id: {
        type: String,
        required: true,
    },
    supabase_id: {
        type: String,
        required: false,
    },
    token: {
        type: String,
        required: false,
    },
    token_expiry: {
        type: Number,
        required: false,
    },
}, {
    timestamps: true,
});

const AuthSchemaModel = mongoose.model<IAuth>("auth", authSchema);

export default AuthSchemaModel;