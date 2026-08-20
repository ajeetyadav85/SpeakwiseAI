import { Router } from 'express';
import { getAdminTelemetryController } from '../controllers/admin.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticateJWT);
router.use(requireRoles('SUPER_ADMIN', 'ORG_ADMIN', 'PRO_USER')); // Demo role permission check
router.get('/telemetry', getAdminTelemetryController);

export default router;
