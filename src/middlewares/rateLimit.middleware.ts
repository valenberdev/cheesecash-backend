import rateLimit from 'express-rate-limit';

export const chatbotRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas solicitudes, esperá un momento antes de volver a intentar' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos, esperá unos minutos antes de volver a intentar' },
  standardHeaders: true,
  legacyHeaders: false,
});