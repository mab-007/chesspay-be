import { Router } from "express";
import AccountService from "../internal/service/account.service";
import logger from "../utils/logger";

class AccountRoute {
    public router: Router;
    private accountService: AccountService;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
        this.accountService = new AccountService();
    }

    private initializeRoutes(): void {
        //Get Account Details useing user id
        this.router.get("/:id", async (req, res) : Promise<any> => {
            try {
                const userId = req.params.id;
                if(!userId) throw new Error("User id is required");
                const accountDetails = await this.accountService.getAccountDetails(userId);
                return res.status(200).json({
                    success: true,
                    data: accountDetails,
                    message: "Account details fetched successfully",
                    error: null,
                });
            }
            catch (error) {
                logger.error(`Error in fetching account details for user: ${req.params.id}`)
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

export default AccountRoute;