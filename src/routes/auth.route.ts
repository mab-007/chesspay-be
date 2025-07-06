import { Router } from "express";
import AuthService from "../internal/service/auth.service";
import logger from "../utils/logger";

class AuthRoute {
    public router = Router();
    private authService: AuthService;

    constructor() {
        this.router = Router();
        this.authService = new AuthService();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(`/signup`, async (req, res) : Promise<any> => {
            try {
                const { uuid, token, token_expiry } = req.body;
                await this.authService.createAuth(uuid, token, token_expiry);
                return res.status(200).json({
                    success: true,
                    data: null,
                    message: "Auth data stored successfully",
                    error: null
                });
            } catch (error) {
                logger.error(`Error in storing auth data for user ${req}: ${error}`);
                return res.status(500).json({
                    success: false,
                    data: null,
                    message: "Internal Server Error",
                    error: "Internal Server Error"
                });
            }
        });

    }

}

export default AuthRoute;