import { Router } from "express";

class UserRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/users', (req, res) => {
            res.status(200).json({ message: 'List of users' });
        });

        this.router.post('/users', (req, res) => {
            res.status(201).json({ message: 'User created' });
        });

        this.router.get('/users/:id', (req, res) => {
            const userId = req.params.id;
            res.status(200).json({ message: `User details for ID: ${userId}` });
        });

        this.router.put('/users/:id', (req, res) => {
            const userId = req.params.id;
            res.status(200).json({ message: `User with ID: ${userId} updated` });
        });

        this.router.delete('/users/:id', (req, res) => {
            const userId = req.params.id;
            res.status(200).json({ message: `User with ID: ${userId} deleted` });
        });
    }


}