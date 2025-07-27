import mongoose from "mongoose";
import { ITransaction, TransactionStatus, TransactionType } from "../interface/entity/transaction.entity.interface";


const transactionSchema = new mongoose.Schema<ITransaction>({
    user_id: { type: String, required: true },
    transaction_id: { type: String, required: true, unique: true },
    account_id: { type: String, required: true },
    transaction_type: { type: String, required: true },
    topup_amount: { type: Number, required: false },
    transaction_amount: {type: Number,required: true},
    transaction_currency: {type: String,required: true },
    transaction_status: {type: String,required: true},
    transaction_nature: {type: String,required: true},
    transaction_date: {type: Number,required: true},
    transaction_description: {type: String,required: false},
    transaction_fee: {type: Number,required: false},
    transaction_reference: {type: String,required: false},
    transaction_reward: {type: Number,required: false},
    reward_id: {type: String, required: false, },
    is_active: { type: Boolean, required: true, default: true},
    order_id: { type: String, required: false },
    rzp_metadata: { type: Object, required: false }
}, {
    timestamps: true,
});


const TransactionModel = mongoose.model<ITransaction>('transaction', transactionSchema);

export default TransactionModel;