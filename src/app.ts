import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import meetingRoutes from './routes/meetingRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.originalUrl}`);
  next();
});


// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Meeting Scheduler API Documentation'
}));

// Serve Swagger JSON 
app.get('/swagger.json', (req, res) => { 
    res.setHeader('Content-Type', 'application/json'); 
    res.send(swaggerSpec); 
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', meetingRoutes);

// Error handler
app.use(errorHandler);

// Development route logger
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

export default app;
