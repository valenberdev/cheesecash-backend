import { describe, it, expect, vi } from 'vitest';
import { createWallet, findWalletByUserId, findWalletById } from '../../src/repositories/wallet.repository';
import { pool } from '../../src/config/db';

vi.mock('../../src/config/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('createWallet', () => {
  it('inserta la wallet y devuelve los datos creados', async () => {
    const fakeWallet = { id: 1, user_id: 10, name: 'Principal', is_active: true, created_at: new Date(), updated_at: new Date() };
    const fakeClient = { query: vi.fn().mockResolvedValueOnce({ rows: [fakeWallet] }) };

    const result = await createWallet(fakeClient as any, 10);

    expect(result.user_id).toBe(10);
    expect(fakeClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO wallets'),
      [10]
    );
  });
});

describe('findWalletByUserId', () => {
  it('devuelve la wallet cuando existe', async () => {
    const fakeWallet = { id: 1, user_id: 10, name: 'Principal', is_active: true, created_at: new Date(), updated_at: new Date() };

    (pool.query as any).mockResolvedValueOnce({ rows: [fakeWallet] });

    const result = await findWalletByUserId(10);

    expect(result?.user_id).toBe(10);
  });

  it('devuelve null si el usuario no tiene wallet', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const result = await findWalletByUserId(999);

    expect(result).toBeNull();
  });
});

describe('findWalletById', () => {
  it('devuelve la wallet por id', async () => {
    const fakeWallet = { id: 5, user_id: 10, name: 'Principal', is_active: true, created_at: new Date(), updated_at: new Date() };

    (pool.query as any).mockResolvedValueOnce({ rows: [fakeWallet] });

    const result = await findWalletById(5);

    expect(result?.id).toBe(5);
  });

  it('devuelve null si el id no existe', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const result = await findWalletById(999);

    expect(result).toBeNull();
  });
});