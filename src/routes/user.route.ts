import { Router } from "express";
import UserService from "../internal/service/user.service";
import logger from "../utils/logger";

class UserRouter {
    public router: Router;
    private userService: UserService;


    constructor() {
        this.router = Router();
        this.initializeRoutes();
        this.userService = new UserService();
    }

    private initializeRoutes(): void {

        this.router.post('/', async (req, res) : Promise<any>=> {
            try {
                const {user_type, username, email, country, fetchChessDotComData, password_hash, first_name, last_name, date_of_birth, profile_picture_url } = req.body;
                if(!user_type || !username || !email || !country || !fetchChessDotComData) {
                    throw new Error('Missing required fields');
                }
                const result = await this.userService.createUser(user_type, username, email, country, fetchChessDotComData, password_hash, first_name, last_name, date_of_birth, profile_picture_url);
                return res.status(200).json({
                    status: 'success',
                    data: result,
                    message: 'User created successfully',
                    error: null
                });

            } catch (err) {
                logger.error(`Error creating user: ${err}`);
                return res.status(500).json({
                    status: 'error',
                    data: null,
                    message: 'Failed to create user',
                    error: err
                });
            }
        });

        this.router.get('/:id', async (req, res) : Promise<any> => {
            try {
                const userId = req.params.id;
                if(!userId) {
                    throw new Error('User id is required');
                }
                const result = await this.userService.getUserDetils(userId);
                return res.status(200).json({
                    status: 'success',
                    data: result,
                    message: 'User details fetched successfully',
                    error: null
                });

            } catch (err) {
                logger.error(`Error fetching user details: ${err}`);
                return res.status(500).json({
                    status: 'error',
                    data: null,
                    message: 'Failed to fetch user details',
                    error: err
                });
            }
        });

        this.router.put('/:id', async (req, res) : Promise<any>=> {
            try {
                const userId = req.params.id;
                if(!userId) {
                    throw new Error('User id is required');
                }
                const { password_hash, first_name, last_name, date_of_birth, profile_picture_url } = req.body;
                const result = await this.userService.updateUserProfile(userId, password_hash, first_name, last_name, date_of_birth, profile_picture_url);
                return res.status(200).json({
                    status: 'success',
                    data: result,
                    message: 'User profile updated successfully',
                    error: null
                });
            } catch (err) {
                logger.error(`Error updating user status: ${err}`);
                return res.status(500).json({
                    status: 'error',
                    data: null,
                    message: 'Failed to update user status',
                    error: err
                });
            }
        });

    }


}

export default UserRouter;