import { Router } from 'express';
import authRoutes from './auth.routes.js';
import groupRoutes from './group.routes.js';
import wordsRoutes from './words.routes.js';
import violationsRoutes from './violations.routes.js';
import statsRoutes from './stats.routes.js';
import webhookRoutes from './webhook.routes.js';
import simulatorRoutes from './simulator.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);
router.use('/words', wordsRoutes);
router.use('/violations', violationsRoutes);
router.use('/stats', statsRoutes);
router.use('/webhook', webhookRoutes);
router.use('/simulator', simulatorRoutes);

export default router;
