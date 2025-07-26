export interface ITournament {
    tournament_id: string;
    tournament_name: string;
    tournament_type: string;
    tournament_status: string;
    tournament_start_date: number;
    tournament_end_date: number;
    tournament_socket_id?: string;
    tournament_description?: string;
    tournament_prize_pool: number;
    tournament_participants: number;
    tournament_result?: string;
    is_active: boolean;
    last_participation_date?: number;
}
