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
                
                return res.status(200).send(
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

        this.router.get('/addmoney/:user_id', async (req, res) : Promise<any> => {
            try {
                const user_id = req.params.user_id
                if(!user_id) throw new Error('user_id is required');
                const result = await this.paymentService.fetchAddMoneyTransactionHistory(user_id);

                return res.status(200).send({
                    status: 'success',
                    data: result,
                    message: 'Add money transaction history fetched successfully',
                    error: null
                });
            } catch (error) {
                console.error('Error fetching add money transaction history:', error);
                return res.status(500).send({
                    status: 'error',
                    data: null,
                    message: 'Failed to fetch add money transaction history',
                    error: 'Internal Server Error'
                });
            }
        });

        this.router.get('/withdrawal/:user_id', async (req, res) : Promise<any> => {
            try {
                const user_id = req.params.user_id
                if(!user_id) throw new Error('user_id is required');
                const result = await this.paymentService.fetchwithdrawalTransactionHistory(user_id);

                return res.status(200).send({
                    status: 'success',
                    data: result,
                    message: 'withdrawal transaction history fetched successfully',
                    error: null
                });

            } catch (error) {
                console.error('Error fetching withdrawal transaction history:', error);
                return res.status(500).send({
                    status: 'error',
                    data: null,
                    message: 'Failed to fetch withdrawal transaction history',
                    error: 'Internal Server Error'
                });
            }
        });
    }

}

export default PaymentRoute;