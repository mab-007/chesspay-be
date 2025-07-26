import mongoose from "mongoose";
import { ITournament } from "../interface/entity/tournament.entity.interface";

const tournamentSchema = new mongoose.Schema<ITournament>({
    tournament_id: { type: String, required: true },
    tournament_name: { type: String, required: true },
    tournament_type: { type: String, required: true },
    tournament_status: { type: String, required: true },
    tournament_start_date: { type: Number, required: true },
    tournament_end_date: { type: Number, required: true },
    tournament_socket_id: { type: String, required: false },
    tournament_description: { type: String, required: false },
    tournament_prize_pool: { type: Number, required: true },
    tournament_participants: { type: Number, required: true },
    tournament_result: { type: String, required: false },
    is_active: { type: Boolean, required: true },
    last_participation_date: { type: Number, required: false },
}, {
    timestamps: true,
});

const TournamentModel = mongoose.model<ITournament>('tournament', tournamentSchema);

export default TournamentModel;