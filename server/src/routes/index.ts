import { Router } from 'express';
import authRoutes from './auth.routes.js';
import sessionRoutes from './session.routes.js';
import reportRoutes from './report.routes.js';
import topicRoutes from './topic.routes.js';
import analyticsRoutes from './analytics.routes.js';
import adminRoutes from './admin.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import contentRoutes from './content.routes.js';
import usageRoutes from './usage.routes.js';
import gamificationRoutes from './gamification.routes.js';
import { createOrderController, verifyPaymentController } from '../controllers/subscription.controller.js';
import { optionalJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);
router.use('/reports', reportRoutes);
router.use('/topics', topicRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/content', contentRoutes);
router.use('/usage', usageRoutes);
router.use('/gamification', gamificationRoutes);

// Direct Razorpay Standard Checkout endpoints under api router
router.post('/create-order', optionalJWT, createOrderController);
router.post('/verify-payment', optionalJWT, verifyPaymentController);

export default router;

