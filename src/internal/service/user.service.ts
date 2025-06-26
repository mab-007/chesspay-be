import { randomUUID } from "crypto";
import { IUser } from "../../interface/entity/user.entity.interface";
import UserRepository from "../../repository/user.repository";
import logger from "../../utils/logger";
import { IChessDotComRaitingObj, IRaiting } from "../../interface/entity/raiting.entity.interface";
import RaitingRepository from "../../repository/raiting.repository";
import ChessDotComService from "../../external/chess.com/chess.com.external";

class UserService {

    private userDetailRepository : UserRepository;
    private raitingRepository : RaitingRepository;
    private chessDotComService : ChessDotComService;



    constructor() {
        this.userDetailRepository = new UserRepository();
        this.raitingRepository = new RaitingRepository();
        this.chessDotComService = new ChessDotComService();
    }

    public async getUserDetils(user_id: string) : Promise<{userDetail: IUser, raitingDetail: IRaiting | null}> {
        try {
            const data = await this.userDetailRepository.findByUserId(user_id);
            const raitingData = await this.raitingRepository.getRaiting(user_id);
            if(!data) {
                throw new Error(`User not found for user id ${user_id}`)
            }
            if(!raitingData) {
                throw new Error(`Raiting not found for user id ${user_id}`)
            }
            return {userDetail: data, raitingDetail: raitingData};
        } catch(err) {
            logger.error(`Error fetching user details for user id ${user_id}: ${err}`)
            throw new Error(`Error fetching user details for user id ${user_id}: ${err}`)
        }
    }

    private async createRaiting(user_id: string, user_type: string, isChessDotCom?: boolean) : Promise<IRaiting> {

        try {
            let chessDotComRes : IChessDotComRaitingObj | null = null;
               // Fetch chess.com raiting object
            if(user_type === 'CHESS_DOT_COM' && isChessDotCom) 
                chessDotComRes = await this.chessDotComService.getChessDotComPlayerStats(user_id);
            
            if(!chessDotComRes){
                chessDotComRes = {
                    blitz: {
                        last: {
                            raiting: 0,
                            date: new Date().getTime(),
                            rd: 0
                        },
                        best: {
                            raiting: 0,
                            date: new Date().getTime(),
                            game: ''
                        },
                        record: {
                            win: 0,
                            loss: 0,
                            draw: 0
                        }
                    },
                    rapid: {
                        last: {
                            raiting: 0,
                            date: new Date().getTime(),
                            rd: 0
                        },
                        best: {
                            raiting: 0,
                            date: new Date().getTime(),
                            game: ''
                        },
                        record: {
                            win: 0,
                            loss: 0,
                            draw: 0
                        }
                    },
                    bullet: {
                        last: {
                            raiting: 0,
                            date: new Date().getTime(),
                            rd: 0
                        },
                        best: {
                            raiting: 0,
                            date: new Date().getTime(),
                            game: ''
                        },
                        record: {
                            win: 0,
                            loss: 0,
                            draw: 0
                        }
                    }
                }
            }
            
            let raitingObj: IRaiting = {
                user_id: user_id,
                raiting_id: 'RAITING-' + new Date().getTime(),
                ...chessDotComRes
            }

            if(!raitingObj) {
                throw new Error(`Error creating raiting for user ${user_id}`)
            }

            const res = await this.raitingRepository.createRaiting(raitingObj);
            return res;
        } catch(err) {
            logger.error(`Error creating raiting for user
                ${user_id}: ${err}`)
            throw new Error(`Error creating raiting for user ${user_id}: ${err}`)
        }
    }


    public async createUser(user_type: string, username: string, email: string, country: string, password_hash?: string, first_name?: string, last_name?: string, date_of_birth?: string, profile_picture_url?: string) : Promise<any> {
        try {
            // Create raiting for the user
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

            const raitingResult = await this.createRaiting(userObj.user_id, user_type, user_type === 'CHESS_DOT_COM' ? true : false);
            userObj.raiting_id = raitingResult.raiting_id;
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