import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  fullName: z.string().min(1, 'El nombre es requerido'),
  birthDate: z.string(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El token es requerido'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});