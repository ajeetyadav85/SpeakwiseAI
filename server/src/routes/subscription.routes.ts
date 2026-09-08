import { Router } from 'express';
import {
  createOrderController,
  verifyPaymentController,
  razorpayWebhookController,
  getPaymentHistoryController,
} from '../controllers/subscription.controller.js';
import { optionalJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/create-order', optionalJWT, createOrderController);
router.post('/verify-payment', optionalJWT, verifyPaymentController);
router.post('/webhook', razorpayWebhookController);
router.get('/history', optionalJWT, getPaymentHistoryController);

export default router;
