import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from "@aws-sdk/client-sqs";
import logger from "../../utils/logger";
// You would import the relevant service to process the message payload.
// import gameService from "../../internal/service/game.service";

const config = {
    region: process.env.AWS_REGION || 'us-east-1',
    queueUrl: process.env.GAME_UPDATE_QUEUE_URL,
};

class GameUpdateSqsWorker {
    private sqsClient: SQSClient;
    private queueUrl: string;
    private isRunning: boolean = false;

    constructor() {
        if (!config.queueUrl) {
            logger.error("GAME_UPDATE_QUEUE_URL environment variable is not set. Worker cannot start.");
            throw new Error("SQS Queue URL is not configured.");
        }
        this.queueUrl = config.queueUrl;
        this.sqsClient = new SQSClient({ region: config.region });
        logger.info(`GameUpdateSqsWorker initialized for queue: ${this.queueUrl}`);
    }

    /**
     * Starts the worker to continuously poll for messages from the SQS queue.
     */
    public start(): void {
        if (this.isRunning) {
            logger.warn("Worker is already running.");
            return;
        }
        this.isRunning = true;
        logger.info("Starting SQS worker...");
        this.poll();

        // Register handlers for graceful shutdown
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    /**
     * Stops the worker from polling for new messages after the current batch is processed.
     */
    public stop(): void {
        if (!this.isRunning) {
            return;
        }
        logger.info("Stopping SQS worker... will exit after current poll.");
        this.isRunning = false;
    }

    /**
     * The main polling loop to receive and process messages.
     */
    private async poll(): Promise<void> {
        while (this.isRunning) {
            try {
                const receiveCommand = new ReceiveMessageCommand({
                    QueueUrl: this.queueUrl,
                    MaxNumberOfMessages: 10, // Process up to 10 messages at a time
                    WaitTimeSeconds: 20,     // Use long polling for efficiency
                });

                const { Messages } = await this.sqsClient.send(receiveCommand);

                if (Messages && Messages.length > 0) {
                    logger.info(`Received ${Messages.length} messages.`);
                    // Process all messages concurrently
                    await Promise.all(Messages.map(message => this.handleMessage(message)));
                }
            } catch (error) {
                logger.error("Error receiving messages from SQS:", { error });
                // Avoid fast-looping on persistent errors
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        logger.info("Worker has stopped polling.");
    }

    /**
     * Handles a single message: processes it and then deletes it on success.
     */
    private async handleMessage(message: Message): Promise<void> {
        try {
            await this.processMessage(message);

            const deleteCommand = new DeleteMessageCommand({
                QueueUrl: this.queueUrl,
                ReceiptHandle: message.ReceiptHandle,
            });
            await this.sqsClient.send(deleteCommand);
            logger.info(`Successfully processed and deleted message ID: ${message.MessageId}`);
        } catch (error) {
            // If processing fails, the message is not deleted. It will reappear in the
            // queue after the visibility timeout for another attempt.
            logger.error(`Failed to process message ID: ${message.MessageId}`, { error });
        }
    }

    /**
     * Contains the core business logic for processing a single game update message.
     */
    private async processMessage(message: Message): Promise<void> {
        logger.info(`Processing message ID: ${message.MessageId}`);
        if (!message.Body) {
            throw new Error("Message body is empty.");
        }

        const gameUpdatePayload = JSON.parse(message.Body);

        // --- YOUR BUSINESS LOGIC GOES HERE ---
        // Example: await gameService.applyMove(gameUpdatePayload);
        logger.info("Game update data:", { data: gameUpdatePayload });
    }
}

export { GameUpdateSqsWorker };