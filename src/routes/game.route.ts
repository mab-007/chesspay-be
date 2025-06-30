import { Router } from "express";
import logger from "../utils/logger";
import GameService from "../internal/service/game.service";

class GameRoute {
    public router: Router;
    private gameService: GameService;


    constructor() {
        this.router = Router();
        this.gameService = new GameService();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Define game-related routes here
        this.router.get("/history", async (req, res) : Promise<any> => {
            try {
                const userId : any = req.query.userId;
                if(!userId) throw new Error("User id is required");
                const result = await this.gameService.getGameHistory(userId);
                return res.status(200).json({ 
                    success: true, 
                    data: result, 
                    message: "Game history fetched successfully", 
                    error: null 
                });
            } catch (error) {
                logger.error(`Error in fetching account details for user: ${req.query.userId}`)
                return res.status(500).json({ 
                    success: false, 
                    data: null, 
                    message: "Internal Server Error", 
                    error: "Internal Server Error" 
                });
            }
        });

        this.router.post("/user/raiting", async (req, res) : Promise<any> => {
            try {
                const userId : any = req.query.userId;
                if(!userId) throw new Error("User id is required");
                
            } catch (error) {
                logger.error(`Error in fetching user game rating for user: ${req.query.userId}`);
                return res.status(500).json({ 
                    success: false, 
                    data: null, 
                    message: "Internal Server Error", 
                    error: "Internal Server Error" 
                });
            }
        });
    }
}

export default GameRoute;