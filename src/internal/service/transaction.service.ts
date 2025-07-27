import mongoose, { ClientSession } from "mongoose";
import { randomUUID } from "crypto";
import { IReward, RewardType } from "../../interface/entity/reward.entity.inteface";
import { Currency, ITransaction, TransactionStatus, TransactionType } from "../../interface/entity/transaction.entity.interface";
import TransactionRepository from "../../repository/transaction.repository";
import { ServiceConstants } from "../../utils/constant.utils";
import logger from "../../utils/logger";
import RewardService from "./reward.service";


type DepositToReward = {
    depositAmount : number;
    rewardAmount : number;
    modifiedDepositAmount: number
}

class TransactionService {
    private transactionRepository: TransactionRepository;
    private rewardService: RewardService;

    constructor() {
        this.transactionRepository = new TransactionRepository();
        this.rewardService = new RewardService();
    }

    private findActualAmtAndRewardFromRequest(amount: number) : DepositToReward {
        try {
            const modifiedDepositAmountRaw = Math.floor(amount / (1 + ServiceConstants.DEPOSIT_TAX_RATE));
            const modifiedDepositAmount = Math.round(modifiedDepositAmountRaw * 100) / 100;
            const rewardAmount = Math.round((amount - modifiedDepositAmount) * 100) / 100;

            const res : DepositToReward = {
                depositAmount: amount,
                rewardAmount: rewardAmount,
                modifiedDepositAmount: modifiedDepositAmount
            }

            return res;
        } catch(err) {
            logger.error('Error finding actual amount and reward from request:', err);
            throw err;
        }
    }

    public async createTransaction(user_id: string, account_id: string, amount: string, type: TransactionType, transaction_nature: String): Promise<ITransaction> {
        const topupAmount = Number(amount);
        if (isNaN(topupAmount) || topupAmount <= 0) {
            throw new Error('Invalid or non-positive amount provided.');
        }

        const session = await mongoose.startSession();

        try {
            const createdTransaction = await session.withTransaction(async (session: ClientSession) => {
                let actualAmount = topupAmount;
                let rewardAmount = 0;
                let reward: IReward | null = null;

                // Calculate deposit and reward only for ADD_MONEY transactions
                if (type === TransactionType.ADD_MONEY) {
                    const depositDetails = this.findActualAmtAndRewardFromRequest(topupAmount);
                    actualAmount = depositDetails.modifiedDepositAmount;
                    rewardAmount = depositDetails.rewardAmount;
                }

                console.log('transaction type : ' +type);
                // If there's a reward, create it within the same transaction
                if (rewardAmount > 0) {
                    reward = await this.rewardService.addnewReward(
                        user_id,
                        rewardAmount,
                        'INR',
                        RewardType.ADD_MONEY_REWARD,
                        undefined, // description
                        undefined, // reference
                        session    // Pass the session
                    );
                }

                const transaction: ITransaction = {
                    user_id,
                    account_id,
                    transaction_id: `TXN-${randomUUID()}`, // Use a more robust unique ID
                    transaction_type: type,
                    topup_amount: topupAmount,
                    transaction_amount: actualAmount,
                    transaction_currency: Currency.INR,
                    transaction_status: TransactionStatus.IN_PROGRESS,
                    transaction_nature: transaction_nature,
                    transaction_date: Date.now(),
                    transaction_description: TransactionType[type], // More descriptive (e.g., "ADD_MONEY")
                    transaction_fee: 0,
                    transaction_reward: rewardAmount,
                    reward_id: reward?.reward_id,
                    is_active: true,
                };

                // The repository method must accept the session
                const newTransaction = await this.transactionRepository.createTransaction(transaction, session);
                if (!newTransaction) {
                    // This will trigger the transaction to abort
                    throw new Error('Failed to create transaction record.');
                }
                return newTransaction;
            });

            return createdTransaction;
        } catch (error) {
            logger.error(`Error creating transaction for user ${user_id}:`, { error, amount, type });
            throw error; // Re-throw the original error to be handled by the caller
        } finally {
            await session.commitTransaction();
            await session.endSession(); // Ensure the session is always closed
        }
    }
    

    public async updateTransactionStatus(transactionId: string, status: TransactionStatus, session?: ClientSession): Promise<ITransaction> {
        try {
            const session = await mongoose.startSession();
            const updatedTransaction = await this.transactionRepository.updateTransactionStatus(transactionId, status, session);
            if (!updatedTransaction) {
                throw new Error('Failed to update transaction status.');
            }
            return updatedTransaction;
        } catch (error) {
            logger.error('Error updating transaction status:', error);
            throw error;
        }
    }


    public async udpateRzPaymentDetails(transactionId: string, txnStatus: TransactionStatus, order_id: string, metadata: any) : Promise<void> {
        try {
            const txnObj : Partial<ITransaction> = {
                order_id: order_id,
                transaction_status: txnStatus,
                rzp_metadata: metadata
            }
            await this.transactionRepository.updateTransaction(transactionId, txnObj);
        } catch(err) {
            logger.error(`Error in updating payment detals for ${transactionId} orderId: ${order_id}`, err);
            throw new Error(`Error in updating payment detals for ${transactionId} orderId: ${order_id} with error ${err}`);
        }
    }

    public async fetchTransactionListByType(userId: string, transactionType: TransactionType): Promise<Array<ITransaction>> {
        try {
            const transactions = await this.transactionRepository.getTransactionByType(userId, transactionType);
            return transactions;
        } catch (error) {
            logger.error('Error fetching transaction list:', error);
            throw error;
        }
    }
}

export default TransactionService;