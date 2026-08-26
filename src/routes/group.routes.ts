import { Router } from 'express';
import { GroupController, updateSettingsSchema, broadcastSchema } from '../controllers/group.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', GroupController.getAll);
router.get('/live-groups', GroupController.getLiveGroups);
router.post('/broadcast', validateBody(broadcastSchema), GroupController.broadcastMessage);
router.get('/:id', GroupController.getById);
router.put('/:id/settings', validateBody(updateSettingsSchema), GroupController.updateSettings);
router.patch('/:id/status', GroupController.toggleStatus);

export default router;
