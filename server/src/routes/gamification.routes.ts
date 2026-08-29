import { Router } from 'express';
import { GamificationController } from '../controllers/gamification.controller.js';
import { optionalJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/badges', optionalJWT, GamificationController.getBadges);
router.get('/leaderboard', optionalJWT, GamificationController.getLeaderboard);

export default router;

