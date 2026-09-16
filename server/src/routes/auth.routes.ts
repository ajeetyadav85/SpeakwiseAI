import { Router } from 'express';
import {
  registerController,
  loginController,
  getMeController,
  googleLoginController,
  refreshTokenController,
} from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/google', googleLoginController);
router.post('/refresh', refreshTokenController);
router.get('/me', authenticateJWT, getMeController);

export default router;
