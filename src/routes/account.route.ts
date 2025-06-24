import { Router } from "express";
import AccountService from "../internal/service/account.service";

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
        this.router.get("/:id", async (req, res) => {
            try {
                const userId = req.params.id;
                const accountDetails = await this.accountService.getAccountDetails(userId);
                res.status(200).json(accountDetails);
            }
            catch (error) {
                res.status(500).json({ error: "Internal Server Error" });
            }
        });

        //Update account balance usering user_id and account_id
        this.router.put("/:id", async (req, res) => {
            try {
                const userId = req.params.id;
                const { account_id, balance, type } = req.body;
                const updatedBalance = await this.accountService.updateAccountBalance(userId, account_id, balance, type);
                res.status(200).json(updatedBalance);
            } catch (error) {
                res.status(500).json({ error: "Internal Server Error" });
            }

        })

        
    }
}

export default AccountRoute;