import mongoose from "mongoose";
import { IAccount } from "../interface/entity/account.entity.interface";

const AccountSchema = new mongoose.Schema<IAccount>({ 
  user_id: {type: String, required: true},
  account_id: {type: String, required: true},
  account_status: {type: String, required: true},
  reward_amount_balance: {type: Number, required: true},
  account_balance: {type: Number, required: true},
  currency: {type: String, required: true},
  is_active: {type: Boolean, required: true},
  account_withdrawal_limit: {type: Number, required: true},
}, {
    timestamps: true, 
});

const AccountSchemaModel = mongoose.model<IAccount>("account", AccountSchema);

export default AccountSchemaModel;