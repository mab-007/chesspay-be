import { Router } from "express";

class GameRoute {
    public router: Router;


    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Define game-related routes here
    }
}

export default GameRoute;