import { Model } from "mongoose";
import { IAccount } from "../interface/entity/account.entity.interface";
import AccountSchemaModel from "../entity/account.entity";

class AccountRepository {

    private accountModel : Model<IAccount>;

    constructor() {
        this.accountModel = AccountSchemaModel;
    }

    public async createAccount(account: IAccount) : Promise<IAccount> {
        return await this.accountModel.create(account);
    }

    public async fetchAccountDetailsByAccountId(account_id: string) : Promise<IAccount | null> {
        return await this.accountModel.findOne({account_id: account_id});
    }

    public async fetchAccountDetailsByUserId(user_id: string) : Promise<IAccount | null> {  
        return await this.accountModel.findOne({user_id: user_id});
    }

    public async updateAccountBalance(account: IAccount) : Promise<IAccount | null> {
        return await this.accountModel.findOneAndUpdate({account_id: account.account_id}, account, {new: true});
    }

}

export default AccountRepository;