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


        //Update account balance usering user_id and account_id

        
    }
}

export default AccountRoute;