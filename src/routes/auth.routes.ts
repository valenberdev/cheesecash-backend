import { Router } from 'express';
import { register, login, googleLogin, forgotPassword, resetPasswordEndpoint } from '../controllers/auth.controller';
import { authRateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/login', authRateLimit, login);
router.post('/register', authRateLimit, register);
router.post('/google', googleLogin);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password', authRateLimit, resetPasswordEndpoint);

export default router;