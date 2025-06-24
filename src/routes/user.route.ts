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

        this.router.post('/users', async (req, res) : Promise<any>=> {
            try {
                const { username, email, country, password_hash, first_name, last_name, date_of_birth, profile_picture_url } = req.body;
                const result = await this.userService.createUser(username, email, country, password_hash, first_name, last_name, date_of_birth, profile_picture_url);
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

        this.router.get('/users/:id', async (req, res) : Promise<any> => {
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

        this.router.put('/users/:id', async (req, res) : Promise<any>=> {
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