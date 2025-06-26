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
    blitz: RaitingObj;
    rapid: RaitingObj;
    bullet: RaitingObj;
}


export interface IChessDotComRaitingObj {
    blitz: RaitingObj;
    rapid: RaitingObj;
    bullet: RaitingObj;
}

/**
 * {
    "chess_rapid": {
        "last": {
            "rating": 1138,
            "date": 1727294656,
            "rd": 122
        },
        "best": {
            "rating": 1269,
            "date": 1687850398,
            "game": "https://www.chess.com/game/live/81526427897"
        },
        "record": {
            "win": 101,
            "loss": 80,
            "draw": 15
        }
    },
    "chess_bullet": {
        "last": {
            "rating": 700,
            "date": 1745959219,
            "rd": 113
        },
        "best": {
            "rating": 800,
            "date": 1608627577,
            "game": "https://www.chess.com/game/live/14653602871"
        },
        "record": {
            "win": 127,
            "loss": 104,
            "draw": 3
        }
    },
    "chess_blitz": {
        "last": {
            "rating": 941,
            "date": 1749892480,
            "rd": 53
        },
        "best": {
            "rating": 1066,
            "date": 1682843472,
            "game": "https://www.chess.com/game/live/76582171623"
        },
        "record": {
            "win": 945,
            "loss": 925,
            "draw": 111
        }
    },
    "tactics": {
        "highest": {
            "rating": 1812,
            "date": 1730973346
        },
        "lowest": {
            "rating": 400,
            "date": 1591551829
        }
    },
    "puzzle_rush": {
        "best": {
            "total_attempts": 40,
            "score": 37
        }
    }
}
 */