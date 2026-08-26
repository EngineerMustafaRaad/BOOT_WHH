import { Router } from 'express';
import {
  WordsController,
  createWordSchema,
  updateWordSchema,
  createExceptionSchema,
  uploadMiddleware,
} from '../controllers/words.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', WordsController.getAll);
router.post('/', validateBody(createWordSchema), WordsController.create);
router.put('/:id', validateBody(updateWordSchema), WordsController.update);
router.delete('/:id', WordsController.delete);

// Bulk import from .txt/.csv file
router.post('/import', uploadMiddleware.single('file'), WordsController.importFromFile);

// Delete ALL words (requires confirmation header)
router.delete('/all/confirm', WordsController.deleteAll);

router.get('/exceptions/list', WordsController.getExceptions);
router.post('/exceptions', validateBody(createExceptionSchema), WordsController.createException);
router.delete('/exceptions/:id', WordsController.deleteException);

export default router;
