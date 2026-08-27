import { Router } from 'express';
import { getBalances } from '../controllers/wallet.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/balances', requireAuth, getBalances);

export default router;