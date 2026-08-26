import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', StatsController.getDashboardStats);

export default router;
