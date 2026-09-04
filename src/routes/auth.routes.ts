import { Router } from 'express';
import { register, login, googleLogin, forgotPassword, resetPasswordEndpoint } from '../controllers/auth.controller';
import { authRateLimit } from '../middlewares/rateLimit.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema, resetPasswordSchema, forgotPasswordSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/login',validate(loginSchema), authRateLimit, login);
router.post('/register', validate(registerSchema), authRateLimit, register);
router.post('/google', googleLogin);
router.post('/forgot-password', validate(forgotPasswordSchema), authRateLimit, forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authRateLimit, resetPasswordEndpoint);

export default router;