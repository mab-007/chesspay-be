export type UserDetails = {
    user_id: string;
    username: string;
    email: string;
}


export type LeaderBoardElement = {
    user_id: string;
    username: string;
    points: number;
    wins: number;
    loose: number;
    draws: number;
    elo_change: number;
}