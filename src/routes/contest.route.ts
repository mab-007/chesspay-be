import { Router } from "express";

class ContestRoute {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Define contest-related routes here

        //Get all active contest

        //Get all participated contest history

        //Join new contest

        //Get contest result
    }
}

export default ContestRoute;