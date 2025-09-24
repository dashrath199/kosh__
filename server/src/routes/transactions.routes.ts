import { Router } from 'express';
import { credit, listTransactions, debit, batchCredits } from '../controllers/transactions.controller';

const router = Router();

router.get('/', listTransactions);
router.post('/credit', credit);
router.post('/debit', debit);
router.post('/batch', batchCredits);

export default router;
