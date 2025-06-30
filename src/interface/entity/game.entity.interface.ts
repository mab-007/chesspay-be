export interface IGame {
    user_id: string;
    opponent_id: string;
    game_id: string;
    game_type: string;
    black_player_id: string;
    white_player_id: string;
    black_player_raiting: number;
    white_player_raiting: number;
    game_room_id: string;
    game_status: string;
    game_moves_fen: Array<string>;
    game_result: string;
    game_winner_id?: string;
    transaction_id?: string;
    game_date: Date;
    created_at?: Date;
    updated_at?: Date;
}