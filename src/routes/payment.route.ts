import { Router } from "express";
import PaymentService from "../internal/service/payment.service";
import { error } from "console";

class PaymentRoute {
    public router: Router;
    private paymentService: PaymentService;


    constructor() {
        this.router = Router();
        this.initializeRoutes();
        this.paymentService = new PaymentService();
    }

    private initializeRoutes(): void {
        this.router.post('/create-order', async (req, res) : Promise<any>=> {

            try {
                const { amount, currency, receipt, notes } = req.body;
                if (!amount || !currency) {
                    return res.status(400).json({ error: 'Amount and currency are required' });
                }
                // Call the payment service to create an order
                const createOrderRes = await this.paymentService.createOrder(amount, currency, receipt, notes);
                if (!createOrderRes) {
                    throw new Error('Failed to create order');
                }
                
                return res.status(201).send(
                    {
                        status: 'success',
                        data: createOrderRes,
                        message: 'Order created successfully',
                        error: null
                    }
                );

            } catch (error) {
                console.error('Error creating order:', error);
                return res.status(500).send({
                    status: 'error',
                    data: null,
                    message: 'Failed to create order',
                    error: 'Internal Server Error' 
                });
                
            }
        });

        this.router.post('/verify-payment', async (req, res) : Promise<any> => {
            try {
                console.log('Received request to verify payment:', req.body);
                const { orderId, paymentId, signature } = req.body;

                if (!orderId || !paymentId || !signature) {
                    return res.status(400).json({ error: 'orderId, paymentId, and signature are required' });
                }

                const isVerified = await this.paymentService.verifyPayment(orderId, paymentId, signature);

                return res.status(200).send({
                    status: isVerified ? 'success' : 'failure',
                    data: {isVerified},
                    message: isVerified ? 'Payment verified successfully' : 'Payment verification failed',
                    error: null
                });
            } catch (error) {
                console.error('Error verifying payment:', error);
                return res.status(500).send({ 
                    status: 'error',
                    data: null,
                    message: 'Failed to verify payment',
                    error: 'Internal Server Error'
                });
            }
        });
    }

}

export default PaymentRoute;