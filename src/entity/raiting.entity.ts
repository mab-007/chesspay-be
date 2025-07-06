import mongoose from "mongoose";
import { IRaiting } from "../interface/entity/raiting.entity.interface";

const raitingSchema = new mongoose.Schema<IRaiting>({
    user_id: {
        type: String,
        required: true,
        index: true, // Explicitly create an index for faster queries on user_id
        unique: true,
    },
    raiting_id: {
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

const RaitingModel = mongoose.model<IRaiting>('raiting', raitingSchema);

export default RaitingModel;
