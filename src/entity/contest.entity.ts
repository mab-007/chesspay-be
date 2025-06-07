import mongoose from "mongoose";
import { IContest } from "../interface/entity/contest.entity.interface";


const contestSchema = new mongoose.Schema<IContest>({
    user_id: { type: String, required: true },
    contest_id: { type: String, required: true },
    contest_name: { type: String, required: true },
    contest_type: { type: String, required: true }, // e.g., 'tournament', 'league'
    contest_status: { type: String, required: true }, // e.g., 'active', 'completed', 'cancelled'
    contest_start_date: { type: Number, required: true },
    contest_end_date: { type: Number, required: true },
    contest_description: { type: String },
    contest_prize_pool: { type: Number }, // Total prize pool for the contest
    contest_participants: { type: Number, required: true }, // Number of participants in the contest
    contest_winner: { type: String }, // User ID of the contest winner
    is_active: { type: Boolean, required: true, default: true }, // Indicates if the contest is currently active
    last_participation_date: { type: Number }, // Last date a user participated in the contest
    contest_rules: { type: String }, // Rules of the contest
    contest_prize_distribution: { type: String }, // How the prize pool is distributed among winners
    contest_location: { type: String }, // Location of the contest if applicable
}, {
    timestamps: true,
});

const ContestModel = mongoose.model<IContest>('Contest', contestSchema);

export default ContestModel;