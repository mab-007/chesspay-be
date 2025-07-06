type RaitingLastObj = {
    raiting: number,
    date: number,
    rd?: number
}

type RaitingBestObj = {
    raiting: number,
    date: number,
    game?: string
}

type RaitingRecordObj = {
    win: number,
    loss: number,
    draw: number
}

type RaitingObj = {
    last: RaitingLastObj,
    best: RaitingBestObj,
    record: RaitingRecordObj
}


export interface IRaiting {
    user_id: string;
    raiting_id: string;
    chess_blitz: RaitingObj;
    chess_rapid: RaitingObj;
    chess_bullet: RaitingObj;
    tactics?: {
        highest: RaitingLastObj,
        lowest: RaitingLastObj
    },
    puzzle_rush?: {
        best: {
            total_attempts: number,
            score: number
        }
    }
}


export interface IChessDotComRaitingObj {
    chess_blitz: RaitingObj;
    chess_rapid: RaitingObj;
    chess_bullet: RaitingObj;
    tactics?: {
        highest: RaitingLastObj,
        lowest: RaitingLastObj
    },
    puzzle_rush?: {
        best: {
            total_attempts: number,
            score: number
        }
    }

}