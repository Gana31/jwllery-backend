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

app.get('/',(req,res)=>{
    res.json({message:'Welcome to Evlocator server'});
})

app.use('/api/v1',authRoutes,appconfigRouter,bankRouter,formRouter,userRoutes);

app.all('/{*any}',async(req,res,next)=>{
    return next(new ErrorHandler('Not Found. Kindly check the API path as well as request type', 404));
})

app.use(error)

export default app;
