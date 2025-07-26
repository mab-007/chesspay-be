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

    public async findByAuthId(auth: string): Promise<IUser | null> {
        logger.info(`Fetching user with Auth ID: ${auth}`);
        const result = await this.userModel.findOne({ auth_id: auth });
        return result;
    }

    public async create(userDetails: IUser): Promise<IUser> {
        return await this.userModel.create(userDetails);
    }

    public async update(user_id: string, updates: Partial<IUser>): Promise<any> {
        return await this.userModel.findOneAndUpdate({ user_id: user_id }, updates);
    }

    public async findUsersByIds(userIds: string[]): Promise<IUser[]> {
        if (!userIds || userIds.length === 0) {
            return [];
        }
        logger.info(`Fetching users with IDs: ${userIds.join(', ')}`);
        // Use the $in operator to find all documents where user_id is in the provided array
        const result = await this.userModel.find({ user_id: { $in: userIds } }).exec();
        return result;
    }
}

export default UserRepository;