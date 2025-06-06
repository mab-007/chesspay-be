export interface IGame {
    user_id: string;
    game_id: string;
    game_type: string;
    game_player_black: string;
    game_player_white: string;
    game_status: string;
    game_moves: number;
    game_result: string;
    transaction_id?: string;
    game_date: Date;
    created_at?: Date;
    updated_at?: Date;
}