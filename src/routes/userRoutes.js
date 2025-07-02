import express from 'express';
import { getCurrentLocation } from '../controllers/userController.js';

const router = express.Router();

router.get('/user/:userId/location', getCurrentLocation);

export default router; 