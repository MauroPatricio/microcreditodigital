import express from 'express';
import { getSystemStatus } from '../controllers/healthController.js';

const router = express.Router();

router.get('/', getSystemStatus);

export default router;
