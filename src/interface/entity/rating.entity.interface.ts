type RatingLastObj = {
    rating: number,
    date: number,
    rd?: number
}

type RatingBestObj = {
    rating: number,
    date: number,
    game?: string
}

type RatingRecordObj = {
    win: number,
    loss: number,
    draw: number
}

type RatingObj = {
    last: RatingLastObj,
    best: RatingBestObj,
    record: RatingRecordObj
}


export interface IRating {
    user_id: string;
    rating_id: string;
    chess_blitz: RatingObj;
    chess_rapid: RatingObj;
    chess_bullet: RatingObj;
    tactics?: {
        highest: RatingLastObj,
        lowest: RatingLastObj
    },
    puzzle_rush?: {
        best: {
            total_attempts: number,
            score: number
        }
    }
}


export interface IChessDotComRatingObj {
    chess_blitz: RatingObj;
    chess_rapid: RatingObj;
    chess_bullet: RatingObj;
    tactics?: {
        highest: RatingLastObj,
        lowest: RatingLastObj
    },
    puzzle_rush?: {
        best: {
            total_attempts: number,
            score: number
        }
    }

}