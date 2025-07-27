export interface IAccountDetailsResp {
    user_id: string;
    account_id: string;
    account_balance: number;
    reward_amount_available: number;
    amount_eligible_for_withdrwal: number;
    currency: string;
    total_winnings: number;
    min_account_withdrwal_limit?: number;
    highest_winning_streak?: number;
}


export interface IGameHistoryResposne {
    game_id: string;
    game_type: string;
    black_player_id: string;
    white_player_id: string;
    game_winner_id: string;
    white_player_rating: number;
    black_player_rating: number;
}

export interface IAddMoneyTransaction {
    user_id: string;
    txn_ref: string;
    amount: number;
    reward_amount: number;
    status: string;
    txn_time: number;
    failure_reason?: string;
}

export interface IWithdrawalTransaction {
    user_id: string;
    txn_ref: string;
    withdrawal_amount: number;
    status: string;
    txn_time: number;
    failure_reason?: string;
}