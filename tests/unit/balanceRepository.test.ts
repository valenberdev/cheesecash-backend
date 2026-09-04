import { describe, it, expect, vi } from 'vitest';
import { createInitialBalances, findBalancesByWalletId, adjustBalance, findBalancesByWalletIdForUpdate } from '../../src/repositories/balance.repository';
import { pool } from '../../src/config/db';

vi.mock('../../src/config/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('adjustBalance', () => {
  it('suma un monto positivo al balance', async () => {
    const fakeClient = { query: vi.fn().mockResolvedValueOnce({ rows: [] }) };

    await adjustBalance(fakeClient as any, 1, 'ARS', 500);

    expect(fakeClient.query).toHaveBeenCalledWith(
      expect.stringContaining('amount = amount + $1'),
      [500, 1, 'ARS']
    );
  });

  it('resta un monto cuando el delta es negativo', async () => {
    const fakeClient = { query: vi.fn().mockResolvedValueOnce({ rows: [] }) };

    await adjustBalance(fakeClient as any, 1, 'ARS', -500);

    expect(fakeClient.query).toHaveBeenCalledWith(
      expect.stringContaining('amount = amount + $1'),
      [-500, 1, 'ARS']
    );
  });
});

describe('findBalancesByWalletId', () => {
  it('devuelve un array de balances', async () => {
    const fakeBalances = [
      { id: 1, wallet_id: 1, currency: 'ARS', amount: '1000.00', created_at: new Date(), updated_at: new Date() },
      { id: 2, wallet_id: 1, currency: 'USD', amount: '50.00', created_at: new Date(), updated_at: new Date() },
    ];

    (pool.query as any).mockResolvedValueOnce({ rows: fakeBalances });

    const result = await findBalancesByWalletId(1);

    expect(result).toHaveLength(2);
    expect(result[0].currency).toBe('ARS');
  });

  it('devuelve un array vacío si la wallet no tiene balances', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const result = await findBalancesByWalletId(999);

    expect(result).toEqual([]);
  });
});

describe('findBalancesByWalletIdForUpdate', () => {
  it('incluye FOR UPDATE en la query', async () => {
    const fakeClient = { query: vi.fn().mockResolvedValueOnce({ rows: [] }) };

    await findBalancesByWalletIdForUpdate(fakeClient as any, 1);

    expect(fakeClient.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      [1]
    );
  });
});

describe('createInitialBalances', () => {
  it('inserta las 4 monedas con el saldo inicial de demo', async () => {
    const fakeClient = { query: vi.fn().mockResolvedValueOnce({ rows: [] }) };

    await createInitialBalances(fakeClient as any, 1);

    expect(fakeClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO balances'),
      expect.arrayContaining([1, 'ARS', 10000000, 'USD', 100, 'EUR', 100, 'BTC', 0.01])
    );
  });
});