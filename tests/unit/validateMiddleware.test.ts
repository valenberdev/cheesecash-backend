import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../../src/middlewares/validate.middleware';

function createMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('validate', () => {
  const testSchema = z.object({
    email: z.string().email('Email inválido'),
  });

  it('deja pasar y reemplaza req.body con los datos validados', () => {
    const req: any = { body: { email: 'test@test.com' } };
    const res = createMockRes();
    const next = vi.fn();

    validate(testSchema)(req, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.email).toBe('test@test.com');
  });

  it('rechaza con 400 y el mensaje de Zod si el body no cumple el schema', () => {
    const req: any = { body: { email: 'no-es-un-email' } };
    const res = createMockRes();
    const next = vi.fn();

    validate(testSchema)(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza con 400 si falta un campo requerido', () => {
    const req: any = { body: {} };
    const res = createMockRes();
    const next = vi.fn();

    validate(testSchema)(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});