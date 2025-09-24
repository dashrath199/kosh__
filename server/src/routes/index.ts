import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import dashboardRoutes from './dashboard.routes';
import settingsRoutes from './settings.routes';
import transactionsRoutes from './transactions.routes';
import bankRoutes from './bank.routes';
import investmentsRoutes from './investments.routes';
import * as AuthController from '../controllers/auth.controller';
import { summary as dashboardSummary } from '../controllers/dashboard.controller';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'kosh-server' });
});

// Compatibility endpoints to match JS server index.js for frontend expectations
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kosh-server' });
});

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

router.get('/dashboard', dashboardSummary);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/bank', bankRoutes);
router.use('/investments', investmentsRoutes);

export default router;
