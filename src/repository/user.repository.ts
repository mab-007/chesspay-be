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
        const result = await this.userModel.findById({ user_id: userId }).exec();
        return result;
    }

    public async create(userDetails: IUser): Promise<IUser> {
        // Placeholder for actual database interaction
        return await this.userModel.create(userDetails);
    }

    public async update(user_id: string, updates: Partial<IUser>): Promise<any> {
        // Placeholder for actual database interaction
        return await this.userModel.findOneAndReplace({ user_id: user_id }, updates);
    }
}

export default UserRepository;