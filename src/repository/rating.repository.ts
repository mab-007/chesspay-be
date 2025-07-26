import { Model } from "mongoose";
import { IRating } from "../interface/entity/rating.entity.interface";
import RatingModel from "../entity/rating.entity";

class RatingRepository {

    private ratingModel: Model<IRating>;

    constructor() {
        this.ratingModel = RatingModel;
    }

    public async createRating(rating: IRating): Promise<IRating> {
        return await this.ratingModel.create(rating);
    }

    public async updateRating(user_id: string,rating: Partial<IRating>): Promise<IRating | null> {
        return await this.ratingModel.findOneAndUpdate({ user_id: user_id }, rating, { new: true });
    }

    public async getRating(user_id: string): Promise<IRating | null> {
        return await this.ratingModel.findOne({ user_id });
    }

}

export default RatingRepository;