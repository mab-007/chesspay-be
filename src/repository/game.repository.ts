import { Model } from "mongoose";
import { IGame } from "../interface/entity/game.entity.interface";
import GameModel from "../entity/game.entity";

class GameRepository {
    private gameModel: Model<IGame>;

    constructor() {
        this.gameModel = GameModel;
    }

    public async createGame(game: IGame): Promise<IGame> {
        return await this.gameModel.create(game);
    }

    public async updateGame(game: Partial<IGame>): Promise<IGame | null> {
        return await this.gameModel.findOneAndUpdate({ game_id: game.game_id }, game, { new: true });
    }

    public async getGameHistoryByUserId(user_id: string): Promise<IGame[]> {
        return await this.gameModel.find({ user_id: user_id }).sort({ game_date: -1 }).exec();
    }
}

export default GameRepository;
