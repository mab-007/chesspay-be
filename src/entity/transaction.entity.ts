import mongoose from "mongoose";
import { ITransaction } from "../interface/entity/transaction.entity.interface";


const transactionSchema = new mongoose.Schema<ITransaction>({
    user_id: {
        type: String,
        required: true,
    },
    transaction_id: {
        type: String,
        required: true,
        unique: true,
    },
    account_id: {
        type: String,
        required: true,
    },
    transaction_type: {
        type: String,
        required: true,
    },
    transaction_amount: {
        type: Number,
        required: true,
    },
    transaction_currency: {
        type: String,
        required: true,
    },
    transaction_status: {
        type: String,
        required: true,
    },
    transaction_date: {
        type: Number,
        required: true,
    },
    transaction_description: {
        type: String,
        required: false,
    },
    transaction_fee: {
        type: Number,
        required: false,
    },
    transaction_reference: {
        type: String,
        required: false,
    },
    transaction_reward: {
        type: Number,
        required: false,
    },
    reward_id: {
        type: String,
        required: false,
    },
    is_active: {
        type: Boolean,
        required: true,
        default: true,
    },
}, {
    timestamps: true,
});


const TransactionModel = mongoose.model<ITransaction>('transaction', transactionSchema);

export default TransactionModel;