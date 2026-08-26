import { Router } from 'express';
import { ViolationsController } from '../controllers/violations.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', ViolationsController.getViolations);
router.get('/members', ViolationsController.getMembers);
router.post('/members/:id/reset', ViolationsController.resetMember);

export default router;
