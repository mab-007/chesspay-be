import { randomUUID } from "crypto";
import { IUser } from "../../interface/entity/user.entity.interface";
import UserRepository from "../../repository/user.repository";
import logger from "../../utils/logger";

class UserService {

    private userDetailRepository : UserRepository;

    constructor() {
        this.userDetailRepository = new UserRepository();
    }

    public async getUserDetils(user_id: string) : Promise<IUser> {
        try {
            const data = await this.userDetailRepository.findByUserId(user_id);
            if(!data) {
                throw new Error(`User not found for user id ${user_id}`)
            }
            return data;
        } catch(err) {
            logger.error(`Error fetching user details for user id ${user_id}: ${err}`)
            throw new Error(`Error fetching user details for user id ${user_id}: ${err}`)
        }
    }

    public async createUser(username: string, email: string, country: string, password_hash?: string, first_name?: string, last_name?: string, date_of_birth?: string, profile_picture_url?: string) : Promise<any> {
        try {
            const userObj : IUser = {
                user_id: randomUUID(),
                username: username,
                email: email,
                status: 'ACTIVE',
                country: country,
                password_hash: password_hash,
                first_name: first_name,
                last_name: last_name,
                date_of_birth: date_of_birth ? new Date(date_of_birth).getTime() : undefined,
                profile_picture_url: profile_picture_url,
                is_active: true,
            }

            const res = await this.userDetailRepository.create(userObj);
            return res;
        } catch (err) {
            logger.error(`Error creating user: ${err}`)
            throw new Error(`Error creating user: ${err}`)
        }
    }


    public async updateUserStatus(user_id: string, status: string) : Promise<IUser> {
        try {
            const data = await this.userDetailRepository.update(user_id, {status: status});
            return data;
        } catch(err) {
            logger.error(`Error updating user status for user ${user_id}: ${err}`)
            throw new Error(`Error updating user status for user for ${user_id}: ${err}`)
        }
    }

    public async updateUserProfile(user_id: string, password_hash?: string, first_name?: string, last_name?: string, date_of_birth?: string, profile_picture_url?: string) : Promise<IUser> {
        try {
            const userObj : Partial<IUser> = {
                password_hash,
                first_name,
                last_name,
                date_of_birth: date_of_birth ? new Date(date_of_birth).getTime() : undefined,
                profile_picture_url,
            }
            const res = await this.userDetailRepository.update(user_id, userObj);
            return res;
        } catch(err) {
            logger.error(`Error updating user profile for user ${user_id}: ${err}`)
            throw new Error(`Error updating user profile for user ${user_id}: ${err}`)
        }
    }


}

export default UserService;