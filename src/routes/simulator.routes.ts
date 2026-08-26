import { Router } from 'express';
import { SimulatorController, simulateMessageSchema } from '../controllers/simulator.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/message', validateBody(simulateMessageSchema), SimulatorController.simulateMessage);
router.get('/logs', SimulatorController.getLogs);
router.delete('/logs', SimulatorController.clearLogs);

export default router;
