import { Router } from 'express';
import { createInvestment, getInvestmentsSummary, createLiquidation, grow } from '../controllers/investments.controller';

const router = Router();

router.get('/', getInvestmentsSummary);
router.post('/', createInvestment);
router.post('/liquidate', createLiquidation);
router.post('/grow', grow);

export default router;
