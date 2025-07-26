import { randomUUID } from "crypto";
import { IUser } from "../../interface/entity/user.entity.interface";
import UserRepository from "../../repository/user.repository";
import logger from "../../utils/logger";
import { IChessDotComRatingObj, IRating } from "../../interface/entity/rating.entity.interface";
import ChessDotComService from "../../external/chess.com/chess.com.external";
import AccountService from "./account.service";
import { IAccountDetailsResp } from "../../interface/ui-response/api.response.interface";
import AuthService from "./auth.service";
import RatingRepository from "../../repository/rating.repository";

class UserService {

    private userDetailRepository : UserRepository;
    private ratingRepository : RatingRepository;
    private chessDotComService : ChessDotComService;
    private accountService: AccountService;
    private authService: AuthService;


    constructor() {
        this.userDetailRepository = new UserRepository();
        this.ratingRepository = new RatingRepository();
        this.chessDotComService = new ChessDotComService();
        this.accountService = new AccountService();
        this.authService = new AuthService();
    }

    public async getUserDetils(user_id: string) : Promise<{userDetail: IUser, ratingDetail: IRating | null, accountDetails:  IAccountDetailsResp | null}> {
        try {
            const data = await this.userDetailRepository.findByUserId(user_id);
            const ratingData = await this.ratingRepository.getRating(user_id);
            const accountDetails = await this.accountService.getAccountDetails(user_id);
            if(!data) {
                throw new Error(`User not found for user id ${user_id}`)
            }
            if(!ratingData) {
                throw new Error(`Rating not found for user id ${user_id}`)
            }
            if(!accountDetails) {
                throw new Error(`Account not found for user id ${user_id}`)
            }
            return {userDetail: data, ratingDetail: ratingData, accountDetails: accountDetails};
        } catch(err) {
            logger.error(`Error fetching user details for user id ${user_id}: ${err}`)
            throw new Error(`Error fetching user details for user id ${user_id}: ${err}`)
        }
    }

    private async createRating(user_id: string, isChessDotCom?: boolean, username?: string) : Promise<IRating> {

        try {
            let chessDotComRes : IChessDotComRatingObj | null = null;

               // Fetch chess.com rating object
            if(isChessDotCom && username) 
                chessDotComRes = await this.chessDotComService.getChessDotComPlayerStats(username);
           
            console.log(`chessDotComRes: ${JSON.stringify(chessDotComRes)}`);

            if(!chessDotComRes){
                chessDotComRes = {
                    chess_blitz: {
                        last: {
                            rating: 0,
                            date: new Date().getTime(),
                            rd: 0
                        },
                        best: {
                            rating: 0,
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
                            rating: 0,
                            date: new Date().getTime(),
                            rd: 0
                        },
                        best: {
                            rating: 0,
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
                            rating: 0,
                            date: new Date().getTime(),
                            rd: 0
                        },
                        best: {
                            rating: 0,
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
            
            let ratingObj: IRating = {
                user_id: user_id,
                rating_id: 'RAITING-' + new Date().getTime(),
                ...chessDotComRes
            }

            if(!ratingObj) {
                throw new Error(`Error creating rating for user ${user_id}`)
            }

            const res = await this.ratingRepository.createRating(ratingObj);
            return res;
        } catch(err) {
            logger.error(`Error creating rating for user ${user_id}: ${err}`)
            throw new Error(`Error creating rating for user ${user_id}: ${err}`)
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
                    black_win_percentage: 0,
                    white_win_percentage: 0,
                    is_active: true,
                }
                const ratingResult = await this.createRating(userObj.user_id, fetchChessDotComData, username);
                const userAccount = await this.accountService.createAccount(userObj.user_id, 0, 0, 'INR');
                userObj.rating_id = ratingResult.rating_id;
                const res = await this.userDetailRepository.create(userObj);               
                return {userDetail: res, ratingDetail: ratingResult, accountDetail: userAccount, isExistingUser: false};

            } else {
                const ratingResult = await this.ratingRepository.getRating(userDetails.user_id);
                const userAccount = await this.accountService.getAccountDetails(userDetails.user_id);
                return {userDetail: userDetails, ratingDetail: ratingResult, accountDetail: userAccount, isExistingUser: true};

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
                await this.updateChessDotComRating(user_id, username, fetchChessDotComData);
            }
            return res;
        } catch(err) {
            logger.error(`Error updating user profile for user ${user_id}: ${err}`)
            throw new Error(`Error updating user profile for user ${user_id}: ${err}`)
        }
    }


    private async updateChessDotComRating(user_id: string, username: string, isChessDotCom: boolean) : Promise<void> {
        try {
            let chessDotComRes : IChessDotComRatingObj | null = null;

            if(isChessDotCom && username) 
                chessDotComRes = await this.chessDotComService.getChessDotComPlayerStats(username);

            if(!chessDotComRes)
                throw Error(`Error fetching chess.com rating`);

            console.log(`updating chess.com rating`)
            let ratingObj: Partial<IRating> = {
                ...chessDotComRes
            }
            await this.ratingRepository.updateRating(user_id, ratingObj);
        } catch(err) {
            logger.error(`Error updating chess.com rating for user ${user_id}: ${err}`);
        }
    }

}

export default UserService;