import { Router } from 'express';
import { listSessionsController, createSessionController, uploadAudioController, completePracticeSessionController } from '../controllers/session.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { uploadAudio } from '../middlewares/upload.middleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', listSessionsController);
router.post('/', createSessionController);
router.post('/complete', completePracticeSessionController);
router.post('/practice-complete', completePracticeSessionController);
router.post('/upload', uploadAudio.single('audio'), uploadAudioController);

export default router;
