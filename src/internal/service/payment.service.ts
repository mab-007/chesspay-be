import RazorpayService from "../../external/juspay/razorpay.external";
import logger from "../../utils/logger";
import { CreateOrderResponse } from "../types";

class PaymentService {

    private razorpayServiceInstance = new RazorpayService();
    constructor() {
        // Initialization code can go here
    }

    async createOrder(amount: number, currency: string, receipt?: string, notes?: any): Promise<CreateOrderResponse> {
        try {
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
            const isVerified = await this.razorpayServiceInstance.verifyPayment(orderId, paymentId, signature);
            //TODO: validate and save to db
            return isVerified;
        } catch (error) {
            logger.error('Error in verifying payment at juspay' + error);
            throw new Error('Error verifying payment: ' + error);
        }
    }
}

export default PaymentService;