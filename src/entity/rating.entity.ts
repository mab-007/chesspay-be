import mongoose from "mongoose";
import { IRating } from "../interface/entity/rating.entity.interface";

const ratingSchema = new mongoose.Schema<IRating>({
    user_id: {
        type: String,
        required: true,
        index: true, // Explicitly create an index for faster queries on user_id
        unique: true,
    },
    rating_id: {
        type: String,
        required: true,
    },
    chess_blitz: {
        type: Object,
        required: true,
    },
    chess_rapid: {
        type: Object,
        required: true,
    },
    chess_bullet: {
        type: Object,
        required: true,
    },
    tactics: {
        type: Object,
        required: false,
    },
    puzzle_rush: {
        type: Object,
        required: false,
    }
}, {
    timestamps: true,
});

const RatingModel = mongoose.model<IRating>('rating', ratingSchema);

export default RatingModel;
