import axios from "axios";
import logger from "../../utils/logger";
import { IChessDotComRaitingObj } from "../../interface/entity/raiting.entity.interface";

class ChessDotComService {

    public async getChessDotComPlayerStats(username: string) : Promise<IChessDotComRaitingObj | null> {
        try {
            //https://api.chess.com/pub/player/mab_07/stats
            const res : IChessDotComRaitingObj = await axios.get(`https://api.chess.com/pub/player/${username}/stats`);
            return res;
        } catch (err) {
            logger.error(`Error fetching chess.com player stats: ${err}`)
            return null;
        }
    }

    public async getChessDotComPlayerProfile(username: string) : Promise<any> {
        try {
            //https://api.chess.com/pub/player/mab_07
            const res = await axios.get(`https://api.chess.com/pub/player/${username}`);
            return res;
        } catch (err) {
            logger.error(`Error fetching chess.com player profile: ${err}`)
            throw new Error(`Error fetching chess.com player profile: ${err}`)
        }
    }
        
}

export default ChessDotComService;