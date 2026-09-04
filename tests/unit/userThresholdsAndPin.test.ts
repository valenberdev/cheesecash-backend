import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUserThresholds,
  updateUserThresholds,
  getUserPin,
  setUserPin,
  generateUniquePin,
} from '../../src/repositories/user.repository';
import { pool } from '../../src/config/db';

vi.mock('../../src/config/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUserThresholds', () => {
  it('devuelve los umbrales del usuario', async () => {
    const fakeThresholds = { threshold_ars: '500000.00', threshold_usd: '500.00', threshold_eur: '500.00', threshold_btc_usd: '1000.00' };
    (pool.query as any).mockResolvedValueOnce({ rows: [fakeThresholds] });

    const result = await getUserThresholds(1);

    expect(result?.threshold_ars).toBe('500000.00');
  });

  it('devuelve null si el usuario no existe', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const result = await getUserThresholds(999);

    expect(result).toBeNull();
  });
});

describe('updateUserThresholds', () => {
  it('actualiza los 4 umbrales con los valores correctos', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    await updateUserThresholds(1, { ars: 100000, usd: 200, eur: 200, btcUsd: 500 });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('threshold_ars = $1'),
      [100000, 200, 200, 500, 1]
    );
  });
});

describe('getUserPin', () => {
  it('devuelve el pin del usuario', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [{ user_pin: '123456' }] });

    const result = await getUserPin(1);

    expect(result).toBe('123456');
  });

  it('devuelve null si el usuario no existe', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const result = await getUserPin(999);

    expect(result).toBeNull();
  });
});

describe('setUserPin', () => {
  it('guarda el pin del usuario', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    await setUserPin(1, '654321');

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SET user_pin'),
      ['654321', 1]
    );
  });
});

describe('generateUniquePin', () => {
  it('devuelve un pin de 6 dígitos', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const pin = await generateUniquePin();

    expect(pin).toMatch(/^\d{6}$/);
  });

  it('reintenta si el primer pin generado ya existe', async () => {
    (pool.query as any)
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const pin = await generateUniquePin();

    expect(pin).toMatch(/^\d{6}$/);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});