import rateLimit from 'express-rate-limit';

export const chatbotRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas solicitudes, esperá un momento antes de volver a intentar' },
  standardHeaders: true,
  legacyHeaders: false,
});