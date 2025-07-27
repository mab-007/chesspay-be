import mongoose from "mongoose";
import { IGame } from "../interface/entity/game.entity.interface";


const gameSchema = new mongoose.Schema<IGame>({
    user_id: { type: String, required: true },
    opponent_id: { type: String, required: false },
    game_id: { type: String, required: true, unique: true },
    game_type: { type: String, required: true },
    black_player_id: { type: String, required: false },
    white_player_id: { type: String, required: false },
    black_player_rating: { type: Number, required: false },
    white_player_rating: { type: Number, required: false },
    elo_rating_change: { type: Number, required: false },
    elo_rating: { type: Number, required: false },
    game_room_id: { type: String, required: false },
    game_status: { type: String, required: true },
    game_winner_id: { type: String, required: false },
    game_moves_fen: [{ type: String, required: false }],
    platform_fee: { type: Number, required: true},
    game_result: { type: String, required: false },
    game_amount: { type: Number, required: true },
    game_entry_amount: { type: Number, required: true },
    winning_amount: { type: Number, required: true },
    transaction_id: { type: [String], required: false },
    game_date: { type: Date, required: true },
    tournament_id: { type: String, required: false },
    metadata: { type: Object, required: false },
}, {
    timestamps: true,
});

const GameModel = mongoose.model<IGame>('game', gameSchema);

export default GameModel;
