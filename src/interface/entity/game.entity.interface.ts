export interface IGame {
    user_id: string;
    opponent_id?: string;
    game_id: string;
    game_type: string;
    black_player_id?: string;
    white_player_id?: string;
    game_amount: number;
    game_entry_amount: number;
    winning_amount: number;
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
    platform_fee: number;
    transaction_id?: Array<string>;
    game_date: Date;
    metadata?: Object;
    created_at?: Date;
    updated_at?: Date;
}