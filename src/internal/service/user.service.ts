import { randomUUID } from "crypto";
import { IUser } from "../../interface/entity/user.entity.interface";
import UserRepository from "../../repository/user.repository";
import logger from "../../utils/logger";
import { IChessDotComRaitingObj, IRaiting } from "../../interface/entity/raiting.entity.interface";
import RaitingRepository from "../../repository/raiting.repository";
import ChessDotComService from "../../external/chess.com/chess.com.external";
import AccountService from "./account.service";
import { IAccountDetailsResp } from "../../interface/ui-response/api.response.interface";
import AuthService from "./auth.service";

class UserService {

    private userDetailRepository : UserRepository;
    private raitingRepository : RaitingRepository;
    private chessDotComService : ChessDotComService;
    private accountService: AccountService;
    private authService: AuthService;


    constructor() {
        this.userDetailRepository = new UserRepository();
        this.raitingRepository = new RaitingRepository();
        this.chessDotComService = new ChessDotComService();
        this.accountService = new AccountService();
        this.authService = new AuthService();
    }

    public async getUserDetils(user_id: string) : Promise<{userDetail: IUser, raitingDetail: IRaiting | null, accountDetails:  IAccountDetailsResp | null}> {
        try {
            const data = await this.userDetailRepository.findByUserId(user_id);
            const raitingData = await this.raitingRepository.getRaiting(user_id);
            const accountDetails = await this.accountService.getAccountDetails(user_id);
            if(!data) {
                throw new Error(`User not found for user id ${user_id}`)
            }
            if(!raitingData) {
                throw new Error(`Raiting not found for user id ${user_id}`)
            }
            if(!accountDetails) {
                throw new Error(`Account not found for user id ${user_id}`)
            }
            return {userDetail: data, raitingDetail: raitingData, accountDetails: accountDetails};
        } catch(err) {
            logger.error(`Error fetching user details for user id ${user_id}: ${err}`)
            throw new Error(`Error fetching user details for user id ${user_id}: ${err}`)
        }
    }

    private async createRaiting(user_id: string, isChessDotCom?: boolean, username?: string) : Promise<IRaiting> {

        try {
            let chessDotComRes : IChessDotComRaitingObj | null = null;

               // Fetch chess.com raiting object
            if(isChessDotCom && username) 
                chessDotComRes = await this.chessDotComService.getChessDotComPlayerStats(username);
           
            console.log(`chessDotComRes: ${JSON.stringify(chessDotComRes)}`);

            if(!chessDotComRes){
                chessDotComRes = {
                    chess_blitz: {
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
                    chess_rapid: {
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
                    chess_bullet: {
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
            logger.error(`Error creating raiting for user ${user_id}: ${err}`)
            throw new Error(`Error creating raiting for user ${user_id}: ${err}`)
        }
    }


    public async createUser(auth_id: string, user_type: string, full_name: string, email: string, country: string, fetchChessDotComData: boolean, username?: string, password_hash?: string, first_name?: string, last_name?: string, date_of_birth?: string, profile_picture_url?: string) : Promise<any> {
        try {
            
            let userDetails = await this.userDetailRepository.findByAuthId(auth_id);

            if(!userDetails) {
                const userObj : IUser = {
                    user_id: randomUUID(),
                    username: username || full_name,
                    user_type: user_type,
                    email: email,
                    status: 'ACTIVE',
                    country: country,
                    password_hash: password_hash,
                    auth_id: auth_id,
                    first_name: first_name || full_name.split(' ')[0],
                    last_name: last_name || full_name.split(' ')[1],
                    date_of_birth: date_of_birth ? new Date(date_of_birth).getTime() : undefined,
                    profile_picture_url: profile_picture_url,
                    is_active: true,
                }
                const raitingResult = await this.createRaiting(userObj.user_id, fetchChessDotComData, username);
                const userAccount = await this.accountService.createAccount(userObj.user_id, 0, 0, 'INR');
                userObj.raiting_id = raitingResult.raiting_id;
                const res = await this.userDetailRepository.create(userObj);               
                return {userDetail: res, raitingDetail: raitingResult, accountDetail: userAccount, isExistingUser: false};

            } else {
                const raitingResult = await this.raitingRepository.getRaiting(userDetails.user_id);
                const userAccount = await this.accountService.getAccountDetails(userDetails.user_id);
                return {userDetail: userDetails, raitingDetail: raitingResult, accountDetail: userAccount, isExistingUser: true};

            }

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

    public async updateUserProfile(user_id: string, username?: string, fetchChessDotComData?: boolean, password_hash?: string, first_name?: string, last_name?: string, date_of_birth?: string, profile_picture_url?: string) : Promise<IUser> {
        try {
            console.log(`update user details for user ${user_id} username: ${username} fetchChessDotComData: ${fetchChessDotComData}`)
            const userObj : Partial<IUser> = {
                username,
                password_hash,
                first_name,
                last_name,
                date_of_birth: date_of_birth ? new Date(date_of_birth).getTime() : undefined,
                profile_picture_url,
            }
            const res = await this.userDetailRepository.update(user_id, userObj);
            if(fetchChessDotComData && username) {
                await this.updateChessDotComRaiting(user_id, username, fetchChessDotComData);
            }
            return res;
        } catch(err) {
            logger.error(`Error updating user profile for user ${user_id}: ${err}`)
            throw new Error(`Error updating user profile for user ${user_id}: ${err}`)
        }
    }


    private async updateChessDotComRaiting(user_id: string, username: string, isChessDotCom: boolean) : Promise<void> {
        try {
            let chessDotComRes : IChessDotComRaitingObj | null = null;

            if(isChessDotCom && username) 
                chessDotComRes = await this.chessDotComService.getChessDotComPlayerStats(username);

            if(!chessDotComRes)
                throw Error(`Error fetching chess.com raiting`);

            console.log(`updating chess.com raiting`)
            let raitingObj: Partial<IRaiting> = {
                ...chessDotComRes
            }
            await this.raitingRepository.updateRaiting(user_id, raitingObj);
        } catch(err) {
            logger.error(`Error updating chess.com raiting for user ${user_id}: ${err}`);
        }
    }

}

export default UserService;