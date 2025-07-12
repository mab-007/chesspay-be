import mongoose from "mongoose";
import { IGame } from "../interface/entity/game.entity.interface";


const gameSchema = new mongoose.Schema<IGame>({
    user_id: { type: String, required: true },
    opponent_id: { type: String, required: true },
    game_id: { type: String, required: true, unique: true },
    game_type: { type: String, required: true },
    black_player_id: { type: String, required: true },
    white_player_id: { type: String, required: true },
    black_player_raiting: { type: Number, required: true },
    white_player_raiting: { type: Number, required: true },
    game_room_id: { type: String, required: true },
    game_status: { type: String, required: true },
    game_winner_id: { type: String, required: false },
    game_moves_fen: [{ type: String, required: true }],
    game_result: { type: String, required: true },
    transaction_id: { type: String, required: false },
    game_date: { type: Date, required: true },
}, {
    timestamps: true,
});

const GameModel = mongoose.model<IGame>('game', gameSchema);

export default GameModel;
