import mongoose from "mongoose";
import { IRaiting } from "../interface/entity/raiting.entity.interface";

const raitingSchema = new mongoose.Schema<IRaiting>({
    user_id: {
        type: String,
        required: true,
    },
    raiting_id: {
        type: String,
        required: true,
    },
    blitz: {
        type: Object,
        required: true,
    },
    rapid: {
        type: Object,
        required: true,
    },
    bullet: {
        type: Object,
        required: true,
    },
}, {
    timestamps: true,
});

const RaitingModel = mongoose.model<IRaiting>('raiting', raitingSchema);

export default RaitingModel;
