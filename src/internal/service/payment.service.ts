import { log } from "console";
import RazorpayService from "../../external/juspay/razorpay.external";
import logger from "../../utils/logger";
import { CreateOrderResponse } from "../types";
import { IAddMoneyTransaction, IWithdrawalTransaction } from "../../interface/ui-response/api.response.interface";

class PaymentService {

    private razorpayServiceInstance = new RazorpayService();
    constructor() {
        // Initialization code can go here
    }

    async createOrder(amount: number, currency: string, receipt?: string, notes?: any): Promise<CreateOrderResponse> {
        try {
            logger.info(`Creating order at juspay for amount ${amount} and currency ${currency}`);
            const createOrderRes = await this.razorpayServiceInstance.createOrder(amount, currency, receipt, notes);
            //TODO:  validate and save to db
            return createOrderRes;
        } catch (error) {
            logger.error('Error in creating order at juspay'+error);
            throw new Error('Error creating order: ' + error);
        }
    }

    async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean> {
        try {
            logger.info(`Verifying payment at juspay for orderId ${orderId} and paymentId ${paymentId}`);
            const isVerified = await this.razorpayServiceInstance.verifyPayment(orderId, paymentId, signature);
            //TODO: validate and save to db
            return isVerified;
        } catch (error) {
            logger.error('Error in verifying payment at juspay' + error);
            throw new Error('Error verifying payment: ' + error);
        }
    }

    async fetchAddMoneyTransactionHistory(user_id: string): Promise<Array<IAddMoneyTransaction>> {
        try {
            logger.info(`Fetching add money transaction history for user ${user_id}`);
            let addMoneyHistory : Array<IAddMoneyTransaction> = [];
            return addMoneyHistory;
        } catch (error) {
            logger.error('Error in fetching add money transaction history' + error);
            throw new Error('Error fetching add money transaction history: ' + error);
        }
    }

    async fetchwithdrawalTransactionHistory(user_id: string): Promise<Array<IWithdrawalTransaction>> {
        try {
            logger.info(`Fetching withdrawal transaction history for user ${user_id}`);
            let withdrawalHistory : Array<IWithdrawalTransaction> = [];
            return withdrawalHistory;
        } catch (error) {
            logger.error(`Error in fetching withdrawal transaction history for user ${user_id}` + error);
            throw new Error(`Error fetching withdrawal transaction history for user ${user_id}: ` + error);
        }
    }
}

export default PaymentService;