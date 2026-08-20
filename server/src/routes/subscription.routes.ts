import { Router } from 'express';
import { createOrderController, verifyPaymentController } from '../controllers/subscription.controller.js';

const router = Router();

router.post('/create-order', createOrderController);
router.post('/verify-payment', verifyPaymentController);

export default router;
