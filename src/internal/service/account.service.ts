import { IAccount } from "../../interface/entity/account.entity.interface";
import { IAccountDetailsResp } from "../../interface/ui-response/api.response.interface";
import AccountRepository from "../../repository/account.repository";
import logger from "../../utils/logger";

class AccountService {

    private accountRepository : AccountRepository;

    constructor() {
        this.accountRepository = new AccountRepository();
    }


    public async getAccountDetails(user_id: string): Promise<IAccountDetailsResp> {
        try {
            const result : IAccount | null = await this.accountRepository.fetchAccountDetailsByUserId(user_id);
            if(!result) throw new Error(`Account not found for user: ${user_id}`);
            
            const accountDetailsResp : IAccountDetailsResp = {
                user_id: result.user_id,
                account_id: result.account_id,
                reward_amount_available: result.reward_amount_balance,
                account_balance: result.account_balance,
                amount_eligible_for_withdrwal: result.account_withdrawal_limit,
                currency: result.currency,
                total_winnings: 0,
                min_account_withdrwal_limit: 100
            
            }

            return accountDetailsResp;
        } catch(err) {
            logger.error(`Error in fetching account detais for user_id ${user_id} err ${err}`);
            throw new Error(`Error in fetching account detais for user_id ${user_id} err ${err}`);
        }
    }

    public async updateAccountBalance(user_id: string, account_id: string, amount: number, type: 'credit' | 'debit'): Promise<IAccount> {
        try {
            const fetchAccObj = await this.accountRepository.fetchAccountDetailsByAccountId(account_id);
            if(!fetchAccObj) {
                throw new Error(`Account not found for user: ${user_id}`);
            }
            if(type === 'credit') {
                fetchAccObj.account_balance += amount;
            } else {
                fetchAccObj.account_balance -= amount;
            }

            if(fetchAccObj.account_balance < 0) {
                throw new Error(`Insufficient balance for user: ${user_id}`);
            }

            const result = await this.accountRepository.updateAccountBalance(fetchAccObj);
            if(!result) throw new Error(`Error updating account balance for user: ${user_id}`);

            return result;
        } catch (err) {
            logger.error(`Error updating account balance for user: ${user_id}, error: ${err}`);
            throw new Error(`Error updating account balance for user: ${user_id}, error: ${err}`);
        }
    }

    public async blockAccountAmount(user_id: string, game_amount: number): Promise<boolean> {
        try {
            const updatedAccount = await this.accountRepository.blockAccountAmount(user_id, game_amount);

            if (updatedAccount) {
                logger.info(`Successfully blocked ${game_amount} for user: ${user_id}. New blocked amount: ${updatedAccount.blocked_amount}`);
                return true;
            }
            const account = await this.accountRepository.fetchAccountDetailsByUserId(user_id);
            if (!account) {
                throw new Error(`Attempted to block amount for non-existent account. User ID: ${user_id}`);
            }
            logger.info(`Insufficient balance to block ${game_amount} for user: ${user_id}. Available: ${account.account_balance - account.blocked_amount}`);
            return false;

        } catch (err: any) {
            logger.error(`Error blocking account amount for user: ${user_id}`, { error: err.message });
            throw new Error(`A server error occurred while trying to block funds for user: ${user_id}`);
        }
    }

    public async updaterRewardAmmount(user_id: string, reward_amount: number): Promise<IAccount> {
        try {
            const updatedAccount = await this.accountRepository.updateRewardAmount(user_id, reward_amount);
            if(!updatedAccount) {
                throw new Error(`Error updating reward amount for user: ${user_id}`);
            }
            return updatedAccount;
        } catch(err) {
            logger.error(`Error updating reward amount for user: ${user_id}, error: ${err}`);
            throw new Error
        }
    }

    public async createAccount(user_id: string, account_balance: number, reward_amount_balance: number, currency: string) : Promise<IAccount> {
        try {

            const netAmmount : number = account_balance - reward_amount_balance;

            const accountObj : IAccount = {
                user_id: user_id,
                account_id: 'ACCOUNT-' + new Date().getTime(),
                account_status: 'ACTIVE',
                account_balance: account_balance,
                blocked_amount: 0,
                reward_amount_balance: reward_amount_balance,
                currency: currency,
                is_active: true,
                account_withdrawal_limit: netAmmount
            }

            const result = await this.accountRepository.createAccount(accountObj);
            if(!result) {
                throw new Error(`Error creating account for user: ${user_id}`);
            }
            return result;
        } catch(err) {
            logger.error(`Error creating account for user: ${user_id}, error: ${err}`);
            throw new Error(`Error creating account for user: ${user_id}, error: ${err}`);
        }
    }
}

export default AccountService;