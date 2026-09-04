import { describe, it, expect, vi } from 'vitest';
import {
  createTransfer,
  createPendingTransfer,
  findTransferByConfirmationToken,
  confirmPendingTransfer,
  failPendingTransfer,
  findTransfersByWalletId,
} from '../../src/repositories/transfer.repository';
import { pool } from '../../src/config/db';

vi.mock('../../src/config/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('createTransfer', () => {
  it('inserta la transferencia con status success', async () => {
    const fakeTransfer = { id: 1, from_wallet_id: 1, to_wallet_id: 2, status: 'success' };
    const fakeClient = { query: vi.fn().mockResolvedValueOnce({ rows: [fakeTransfer] }) };

    const result = await createTransfer(fakeClient as any, 1, 2, 'ARS', 5000);

    expect(result.status).toBe('success');
    expect(fakeClient.query).toHaveBeenCalledWith(
      expect.stringContaining("'success'"),
      [1, 2, 'ARS', 5000]
    );
  });
});

describe('createPendingTransfer', () => {
  it('inserta la transferencia con status pending y el token', async () => {
    const fakeTransfer = { id: 1, status: 'pending', confirmation_token: 'xyz789' };
    (pool.query as any).mockResolvedValueOnce({ rows: [fakeTransfer] });

    const result = await createPendingTransfer(1, 2, 'ARS', 600000, 'xyz789', new Date());

    expect(result.status).toBe('pending');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("'pending'"),
      expect.arrayContaining(['xyz789'])
    );
  });
});

describe('findTransferByConfirmationToken', () => {
  it('devuelve la transferencia cuando el token existe', async () => {
    const fakeTransfer = { id: 1, confirmation_token: 'xyz789' };
    (pool.query as any).mockResolvedValueOnce({ rows: [fakeTransfer] });

    const result = await findTransferByConfirmationToken('xyz789');

    expect(result?.confirmation_token).toBe('xyz789');
  });

  it('devuelve null si el token no existe', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const result = await findTransferByConfirmationToken('noexiste');

    expect(result).toBeNull();
  });
});

describe('confirmPendingTransfer', () => {
  it('marca la transferencia como success', async () => {
    const fakeClient = { query: vi.fn().mockResolvedValueOnce({ rows: [] }) };

    await confirmPendingTransfer(fakeClient as any, 1);

    expect(fakeClient.query).toHaveBeenCalledWith(
      expect.stringContaining("'success'"),
      [1]
    );
  });
});

describe('failPendingTransfer', () => {
  it('marca la transferencia como failed', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    await failPendingTransfer(1);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("'failed'"),
      [1]
    );
  });
});

describe('findTransfersByWalletId', () => {
  it('busca transferencias donde la wallet es origen O destino', async () => {
    const fakeTransfers = [{ id: 1, from_wallet_id: 1, to_wallet_id: 2 }];
    (pool.query as any).mockResolvedValueOnce({ rows: fakeTransfers });

    const result = await findTransfersByWalletId(1);

    expect(result).toHaveLength(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('OR to_wallet_id'),
      [1]
    );
  });

  it('devuelve un array vacío si no hay transferencias', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const result = await findTransfersByWalletId(999);

    expect(result).toEqual([]);
  });
});