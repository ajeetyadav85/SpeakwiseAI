import { Router } from 'express';
import { getAnalyticsOverviewController } from '../controllers/analytics.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJWT);
router.get('/overview', getAnalyticsOverviewController);

export default router;
