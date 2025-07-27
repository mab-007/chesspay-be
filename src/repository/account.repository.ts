import { ClientSession, Model } from "mongoose";
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

    public async updateAccountBalance(account: IAccount, session?: ClientSession) : Promise<IAccount | null> {
        return await this.accountModel.findOneAndUpdate({account_id: account.account_id}, account, { session });
    }


    public async blockAccountAmount(user_id: string, game_amount: number) : Promise<IAccount | null> {
        return await this.accountModel.findOneAndUpdate(
            {
                user_id: user_id,
                // Use $expr to compare two fields in the document.
                // Condition: account_balance >= (blocked_amount + game_amount)
                $expr: { $gte: [ "$account_balance", { $add: ["$blocked_amount", game_amount] } ] }
            },
            { $inc: { blocked_amount: game_amount } },
            { new: true }
        ).exec();
    }

    public async unBlockAccountAmount(user_id: string, unblock_amount: number) : Promise<IAccount | null> {
        return await this.accountModel.findOneAndUpdate(
            {
                user_id: user_id,
                $expr: { $gte: [ "$account_balance", { $add: ["$unblocked_amount", -unblock_amount] } ] }
            },
            { $inc: { blocked_amount: -unblock_amount } },
            { new: true }
        ).exec();
    }


    public async updateRewardAmount(user_id: string, reward_amount: number) : Promise<IAccount | null> {
        return await this.accountModel.findOneAndUpdate({user_id: user_id}, 
            {
                $inc: {
                    reward_amount_balance: reward_amount
                }
            });
    }

}

export default AccountRepository;