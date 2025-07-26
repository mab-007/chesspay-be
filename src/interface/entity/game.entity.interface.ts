export interface IGame {
    user_id: string;
    opponent_id?: string;
    game_id: string;
    game_type: string;
    black_player_id?: string;
    white_player_id?: string;
    black_player_rating?: number;
    white_player_rating?: number;
    elo_rating_change?: number;
    elo_rating?: number;
    game_room_id?: string;
    tournament_id?: string;
    game_status: string;
    game_moves_fen?: Array<string>;
    game_result?: string;
    game_winner_id?: string;
    transaction_id?: string;
    game_date: Date;
    created_at?: Date;
    updated_at?: Date;
}