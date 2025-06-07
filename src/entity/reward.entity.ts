import mongoose from "mongoose";
import { IReward } from "../interface/entity/reward.entity.inteface";

const rewardSchema = new mongoose.Schema<IReward>({
    user_id: {
        type: String,
        required: true,
    },
    reward_id: {
        type: String,
        required: true,
    },
    reward_type: {
        type: String,
        required: true,
    },
    reward_amount: {
        type: Number,
        required: true,
    },
    reward_currency: {
        type: String,
        required: true,
    },
    reward_status: {
        type: String,
        required: true,
    },
    reward_date: {
        type: Number,
        required: true,
    },
    reward_description: {
        type: String,
    },
    reward_reference: {
        type: String,
    },
    is_active: {
        type: Boolean,
        required: true,
    }
}, {
    timestamps: true,
});


const RewardModel = mongoose.model<IReward>('reward', rewardSchema);

export default RewardModel;