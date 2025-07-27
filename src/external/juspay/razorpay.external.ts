import Razorpay from "razorpay";
import PgFactory from "../../factory/pg.factory";
import { Orders } from "razorpay/dist/types/orders";
import { razorpayConfig } from "../../config/env.config";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import logger from "../../utils/logger";

class RazorpayService {

    private razorpayInstance: Razorpay;

    constructor() {
        // Initialize Razorpay SDK or any other setup if needed
        this.razorpayInstance = PgFactory.getPGInstance();
        // Constructor can be empty if no instance-specific setup is needed.
    }
    
    async createOrder(amount: number, currency: string, receipt?: string, notes?: any) : Promise<Orders.RazorpayOrder> {
        try {

            const options : Orders.RazorpayOrderCreateRequestBody = {
                amount: amount * 100, // Convert amount to paise
                currency,
                receipt,
                notes,
            };

            if(this.razorpayInstance === undefined) {
                throw new Error("Razorpay instance is not initialized.");
            }

            const order : Orders.RazorpayOrder = await this.razorpayInstance.orders.create(options);
            return order; // Send order details to frontend, including order ID
        } catch (error) {
            logger.error(error);
            throw new Error('Error creating order: ' + error);
        }
    }

    async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean> {
        try {
            if (!this.razorpayInstance) {
                throw new Error("Razorpay instance is not initialized.");
            }

            const secret = razorpayConfig.keySecret; // Assuming key_secret is set in Razorpay instance
            const body = orderId + '|' + paymentId;

            const isValidSignature = validateWebhookSignature(body, signature, secret);
            if (isValidSignature) {
                logger.info("Payment verification successful");
                return true; // Payment verification successful
            } else {
                logger.error("Payment verification failed");
                return false; // Payment verification failed
            }
        } catch (error) {
            logger.error("Payment verification failed:", error);
            throw new Error('Error verifying payment: ' + error);
        }
    }

}

export default RazorpayService;