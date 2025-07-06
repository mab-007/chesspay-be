import { ClientSession, Model } from "mongoose";
import { ITransaction, TransactionStatus, TransactionType } from "../interface/entity/transaction.entity.interface";
import TransactionModel from "../entity/transaction.entity";

class TransactionRepository {

    private transactionModel: Model<ITransaction>;

    constructor() {
        this.transactionModel = TransactionModel;
    }

    public async createTransaction(transaction: ITransaction, session?: ClientSession): Promise<ITransaction> {
        const result = await this.transactionModel.create([transaction], { session });
        return result[0];
    }

    public async findTransactionsByUserId(userId: string): Promise<ITransaction[]> {
        return await this.transactionModel.find({ user_id: userId }).exec();
    }

    public async findTransactionById(transactionId: string): Promise<ITransaction | null> {
        return await this.transactionModel.findOne({ transaction_id: transactionId }).exec();
    }

    public async updateTransactionStatus(transactionId: string, status: TransactionStatus, session?: ClientSession): Promise<ITransaction | null> {
        return await this.transactionModel.findOneAndUpdate(
            { transaction_id: transactionId }, 
            { transaction_status: status }, 
            { session }).exec();
    }

    public async getTransactionByType(userId: string, transactionType: TransactionType): Promise<ITransaction[]> {
        return await this.transactionModel.find({ user_id: userId, transaction_type: transactionType }).exec();
    }

}

export default TransactionRepository;