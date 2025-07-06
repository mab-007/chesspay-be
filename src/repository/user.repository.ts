import { Model } from "mongoose";
import UserModel from "../entity/user.entity";
import { IUser } from "../interface/entity/user.entity.interface";
import logger from "../utils/logger";

class UserRepository {

    private userModel : Model<IUser>;

    constructor() {
        this.userModel = UserModel;
    }

    public async findByUserId(userId: string): Promise<IUser | null> {
        logger.info(`Fetching user with ID: ${userId}`);
        const result = await this.userModel.findOne({ user_id: userId });
        return result;
    }

    public async create(userDetails: IUser): Promise<IUser> {
        return await this.userModel.create(userDetails);
    }

    public async update(user_id: string, updates: Partial<IUser>): Promise<any> {
        return await this.userModel.findOneAndUpdate({ user_id: user_id }, updates);
    }
}

export default UserRepository;