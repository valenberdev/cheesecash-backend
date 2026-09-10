import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET es requerida'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  EXCHANGE_RATE_API_KEY: z.string().min(1, 'EXCHANGE_RATE_API_KEY es requerida'),
  COINGECKO_API_URL: z.string().default('https://api.coingecko.com/api/v3'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY es requerida'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID es requerida'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY es requerida'),
  AWS_REGION: z.string().min(1, 'AWS_REGION es requerida'),
  SES_FROM_EMAIL: z.string().min(1, 'SES_FROM_EMAIL es requerida'),
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL es requerida'),
});

export const env = envSchema.parse(process.env);