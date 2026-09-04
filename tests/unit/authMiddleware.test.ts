import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

import { requireAuth } from '../../src/middlewares/auth.middleware';
import jwt from 'jsonwebtoken';

beforeEach(() => {
  vi.clearAllMocks();
});

function createMockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('requireAuth', () => {
  it('rechaza con 401 si no viene el header Authorization', () => {
    const req: any = { headers: {} };
    const res = createMockRes();
    const next = vi.fn();

    requireAuth(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza con 401 si el header no empieza con Bearer', () => {
    const req: any = { headers: { authorization: 'algo-raro' } };
    const res = createMockRes();
    const next = vi.fn();

    requireAuth(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza con 401 si el token es inválido', () => {
    const req: any = { headers: { authorization: 'Bearer token-invalido' } };
    const res = createMockRes();
    const next = vi.fn();

    (jwt.verify as any).mockImplementationOnce(() => {
      throw new Error('jwt malformed');
    });

    requireAuth(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('deja pasar y setea req.userId si el token es válido', () => {
    const req: any = { headers: { authorization: 'Bearer token-valido' } };
    const res = createMockRes();
    const next = vi.fn();

    (jwt.verify as any).mockReturnValueOnce({ userId: 42 });

    requireAuth(req, res as any, next);

    expect(req.userId).toBe(42);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});