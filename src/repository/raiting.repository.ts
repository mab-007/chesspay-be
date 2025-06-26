import { Model } from "mongoose";
import { IRaiting } from "../interface/entity/raiting.entity.interface";
import RaitingModel from "../entity/raiting.entity";

class RaitingRepository {

    private raitingModel: Model<IRaiting>;

    constructor() {
        this.raitingModel = RaitingModel;
    }

    public async createRaiting(raiting: IRaiting): Promise<IRaiting> {
        return await this.raitingModel.create(raiting);
    }

    public async updateRaiting(user_id: string,raiting: Partial<IRaiting>): Promise<IRaiting | null> {
        return await this.raitingModel.findOneAndUpdate({ user_id: user_id }, raiting, { new: true });
    }

    public async getRaiting(user_id: string): Promise<IRaiting | null> {
        return await this.raitingModel.findOne({ user_id });
    }

}

export default RaitingRepository;