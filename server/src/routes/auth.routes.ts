import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
// Dev-only seed endpoint to create a test user
router.post('/seed-dev', AuthController.seedDev);

export default router;
