import { Router } from 'express';
import {
  getRandomContentController,
  getCategoriesController,
  createContentController,
} from '../controllers/content.controller.js';

const router = Router();

router.get('/random', getRandomContentController);
router.get('/categories', getCategoriesController);
router.post('/', createContentController);

export default router;
