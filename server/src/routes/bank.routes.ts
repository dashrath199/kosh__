import { Router } from 'express';
import { getBank, linkBank } from '../controllers/bank.controller';

const router = Router();

router.get('/', getBank);
router.post('/link', linkBank);

export default router;
