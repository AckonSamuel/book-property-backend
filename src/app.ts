import express from 'express';
import cors from 'cors';
import meetingRoutes from './routes/meetingRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
app.use(cors());

// Custom logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.originalUrl}`);
    next(); // Ensure the request continues to its route handler
});

app.use(express.json());

// Register Routes
app.use('/api', meetingRoutes);

// Error Handling Middleware
app.use(errorHandler);

function logAllRoutes(app: express.Application) {
    app._router.stack.forEach((middleware: any) => {
        if (middleware.route) {  // if it's a route
            const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
            console.log(`${methods} ${middleware.route.path}`);
        }
    });
}

logAllRoutes(app);

export default app;
