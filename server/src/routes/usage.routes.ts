import { Router } from 'express';
import { getUsageStatusController, consumeUsageController } from '../controllers/usage.controller.js';
import { optionalJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/status', optionalJWT, getUsageStatusController);
router.post('/consume', optionalJWT, consumeUsageController);

export default router;
