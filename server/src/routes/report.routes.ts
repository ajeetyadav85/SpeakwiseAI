import { Router } from 'express';
import { getReportController, analyzeSpeechSessionController } from '../controllers/report.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJWT);

router.post('/analyze', analyzeSpeechSessionController);
router.get('/:id', getReportController);

export default router;
