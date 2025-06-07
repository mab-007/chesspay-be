export interface IContest {
    user_id: string;
    contest_id: string;
    contest_name: string;
    contest_type: string; // e.g., 'tournament', 'league'
    contest_status: string; // e.g., 'active', 'completed', 'cancelled'
    contest_start_date: number;
    contest_end_date: number;
    contest_description?: string;
    contest_prize_pool?: number; // Total prize pool for the contest
    contest_participants: number; // Number of participants in the contest
    contest_winner?: string; // User ID of the contest winner
    is_active: boolean; // Indicates if the contest is currently active
    created_at?: Date; // Timestamp when the contest was created
    updated_at?: Date; // Timestamp when the contest was last updated
    last_participation_date?: number; // Last date a user participated in the contest
    contest_rules?: string; // Rules of the contest
    contest_prize_distribution?: string; // How the prize pool is distributed among winners
    contest_location?: string; // Location of the contest if applicable
}