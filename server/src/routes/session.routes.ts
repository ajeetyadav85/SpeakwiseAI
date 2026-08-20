import { Router } from 'express';
import { listSessionsController, createSessionController, uploadAudioController } from '../controllers/session.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { uploadAudio } from '../middlewares/upload.middleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', listSessionsController);
router.post('/', createSessionController);
router.post('/upload', uploadAudio.single('audio'), uploadAudioController);

export default router;
