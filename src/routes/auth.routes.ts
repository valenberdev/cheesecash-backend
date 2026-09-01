import { Router } from 'express';
import { register, login, googleLogin, forgotPassword, resetPasswordEndpoint } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordEndpoint);

export default router;