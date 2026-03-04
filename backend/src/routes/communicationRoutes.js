import express from 'express';
import {
    sendMessage, scheduleMessage, getHistory, getStats, getTemplates, createTemplate
} from '../controllers/communicationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/send', sendMessage);
router.post('/schedule', scheduleMessage);
router.get('/history', getHistory);
router.get('/stats', getStats);
router.get('/templates', getTemplates);
router.post('/templates', createTemplate);

export default router;
