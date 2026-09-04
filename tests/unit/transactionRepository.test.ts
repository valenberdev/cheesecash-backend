import { describe, it, expect, vi } from 'vitest';
import {
  createTransaction,
  findTransactionsByWalletId,
  createPendingTransaction,
  findTransactionByConfirmationToken,
  confirmPendingTransaction,
  failPendingTransaction,
} from '../../src/repositories/transaction.repository';
import { pool } from '../../src/config/db';

vi.mock('../../src/config/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('createTransaction', () => {
  it('inserta la transaccion con status success', async () => {
    const fakeTransaction = { id: 1, wallet_id: 1, type: 'exchange', status: 'success' };
    const fakeClient = { query: vi.fn().mockResolvedValueOnce({ rows: [fakeTransaction] }) };

    const result = await createTransaction(fakeClient as any, 1, 'exchange', 'ARS', 'USD', 1000, 0.66, 0.00066);

    expect(result.status).toBe('success');
    expect(fakeClient.query).toHaveBeenCalledWith(
      expect.stringContaining("'success'"),
      [1, 'exchange', 'ARS', 'USD', 1000, 0.66, 0.00066]
    );
  });
});

describe('findTransactionsByWalletId', () => {
  it('devuelve las transacciones ordenadas por fecha descendente', async () => {
    const fakeTransactions = [
      { id: 2, created_at: new Date('2026-01-02') },
      { id: 1, created_at: new Date('2026-01-01') },
    ];

    (pool.query as any).mockResolvedValueOnce({ rows: fakeTransactions });

    const result = await findTransactionsByWalletId(1);

    expect(result).toHaveLength(2);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY created_at DESC'),
      [1]
    );
  });

  it('devuelve un array vacío si no hay transacciones', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const result = await findTransactionsByWalletId(999);

    expect(result).toEqual([]);
  });
});

describe('createPendingTransaction', () => {
  it('inserta la transaccion con status pending y el token de confirmacion', async () => {
    const fakeTransaction = { id: 1, status: 'pending', confirmation_token: 'abc123' };
    (pool.query as any).mockResolvedValueOnce({ rows: [fakeTransaction] });

    const result = await createPendingTransaction(
      1, 'exchange', 'ARS', 'USD', 600000, 400, 0.00066, 'abc123', new Date()
    );

    expect(result.status).toBe('pending');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("'pending'"),
      expect.arrayContaining(['abc123'])
    );
  });
});

describe('findTransactionByConfirmationToken', () => {
  it('devuelve la transaccion cuando el token existe', async () => {
    const fakeTransaction = { id: 1, confirmation_token: 'abc123', status: 'pending' };
    (pool.query as any).mockResolvedValueOnce({ rows: [fakeTransaction] });

    const result = await findTransactionByConfirmationToken('abc123');

    expect(result?.confirmation_token).toBe('abc123');
  });

  it('devuelve null si el token no existe', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const result = await findTransactionByConfirmationToken('noexiste');

    expect(result).toBeNull();
  });
});

describe('confirmPendingTransaction', () => {
  it('marca la transaccion como success y limpia el token', async () => {
    const fakeClient = { query: vi.fn().mockResolvedValueOnce({ rows: [] }) };

    await confirmPendingTransaction(fakeClient as any, 1);

    expect(fakeClient.query).toHaveBeenCalledWith(
      expect.stringContaining("'success'"),
      [1]
    );
  });
});

describe('failPendingTransaction', () => {
  it('marca la transaccion como failed y limpia el token', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    await failPendingTransaction(1);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("'failed'"),
      [1]
    );
  });
});