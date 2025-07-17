import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import error from './src/middlewares/error.js';
import ErrorHandler from './src/utils/errorHandler.js';
import authRoutes from './src/routes/authRoutes.js';
import appconfigRouter from './src/routes/appconfigRoutes.js'
import bankRouter from './src/routes/bankRoutes.js'
import formRouter from './src/routes/formRoutes.js'
import userRoutes from './src/routes/userRoutes.js';
import  { logRequest, logError } from './src/utils/logger.js';

dotenv.config();
const app = express();

// EJS setup
import path from 'path';
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(express.json());
app.use(cors({
    origin:"*",
    methods:["GET","POST","DELETE","UPDATE","PUT","PATCH"],
    credentials: true,
}))

// Add request logging middleware
app.use(logRequest);

app.get('/',(req,res)=>{
    res.json({message:'Welcome to Jewellery Backend server'});
})

// Health check endpoint for Docker
app.get('/health',(req,res)=>{
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
})

app.use('/api/v1', authRoutes);
app.use('/api/v1', appconfigRouter);
app.use('/api/v1', bankRouter);
app.use('/api/v1', formRouter);
app.use('/api/v1', userRoutes);

app.all('/{*any}',async(req,res,next)=>{
    return next(new ErrorHandler('Not Found. Kindly check the API path as well as request type', 404));
})

// Global error handler with logging
app.use((err, req, res, next) => {
    logError(err, {
        url: req.url,
        method: req.method,
        userId: req.user?.id || 'anonymous',
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    
    // Call the original error handler
    error(err, req, res, next);
});

export default app;
