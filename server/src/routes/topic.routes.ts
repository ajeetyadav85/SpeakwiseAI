import { Router } from 'express';
import { getTopicsController, generateAITopicController } from '../controllers/topic.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJWT);
router.get('/', getTopicsController);
router.post('/generate-ai', generateAITopicController);

export default router;
