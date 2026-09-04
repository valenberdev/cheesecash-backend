import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/repositories/wallet.repository', () => ({
  findWalletByUserId: vi.fn(),
  findWalletById: vi.fn(),
}));

vi.mock('../../src/repositories/balance.repository', () => ({
  findBalancesByWalletId: vi.fn(),
  findBalancesByWalletIdForUpdate: vi.fn(),
  adjustBalance: vi.fn(),
}));

vi.mock('../../src/repositories/transfer.repository', () => ({
  createTransfer: vi.fn(),
  createPendingTransfer: vi.fn(),
  findTransferByConfirmationToken: vi.fn(),
  confirmPendingTransfer: vi.fn(),
  failPendingTransfer: vi.fn(),
  findTransfersByWalletId: vi.fn(),
}));

vi.mock('../../src/repositories/transaction.repository', () => ({
  findTransactionsByWalletId: vi.fn(),
}));

vi.mock('../../src/repositories/user.repository', () => ({
  findUserByEmail: vi.fn(),
  findUserByPin: vi.fn(),
  findUserById: vi.fn(),
  getUserThresholds: vi.fn(),
}));

vi.mock('../../src/services/exchangeRate.service', () => ({
  getExchangeRate: vi.fn(),
}));

vi.mock('../../src/services/email.service', () => ({
  sendEmail: vi.fn(),
  sendTransactionReceiptEmail: vi.fn(),
}));

vi.mock('../../src/config/db', () => ({
  pool: {
    connect: vi.fn().mockResolvedValue({
      query: vi.fn(),
      release: vi.fn(),
    }),
  },
}));

vi.mock('../../src/config/socket', () => ({
  io: {
    to: vi.fn().mockReturnValue({ emit: vi.fn() }),
  },
}));

import { executeTransfer, confirmTransfer, getCombinedHistory } from '../../src/services/transfer.service';
import { findWalletByUserId, findWalletById } from '../../src/repositories/wallet.repository';
import { findBalancesByWalletId, findBalancesByWalletIdForUpdate } from '../../src/repositories/balance.repository';
import { createPendingTransfer, findTransferByConfirmationToken, failPendingTransfer, findTransfersByWalletId } from '../../src/repositories/transfer.repository';
import { findTransactionsByWalletId } from '../../src/repositories/transaction.repository';
import { findUserByEmail, findUserByPin, findUserById, getUserThresholds } from '../../src/repositories/user.repository';
import { getExchangeRate } from '../../src/services/exchangeRate.service';

beforeEach(() => {
  vi.clearAllMocks();
});

const defaultThresholds = {
  threshold_ars: '500000.00',
  threshold_usd: '500.00',
  threshold_eur: '500.00',
  threshold_btc_usd: '1000.00',
};

describe('executeTransfer', () => {
  it('tira error si el monto es cero o negativo', async () => {
    await expect(executeTransfer(1, 'destinatario@test.com', undefined as any, 'ARS', 0)).rejects.toThrow('El monto debe ser mayor a cero');
  });

  it('tira error si la wallet del que transfiere no existe', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce(null);

    await expect(executeTransfer(1, 'destinatario@test.com', undefined as any, 'ARS', 1000)).rejects.toThrow('Wallet no encontrada');
  });

  it('tira error si no se indica ni email ni pin', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });

    await expect(executeTransfer(1, undefined as any, undefined as any, 'ARS', 1000)).rejects.toThrow('Tenés que indicar un email o un PIN de destinatario');
  });

  it('tira error si el destinatario no existe (por email)', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });
    (findUserByEmail as any).mockResolvedValueOnce(null);

    await expect(executeTransfer(1, 'noexiste@test.com', undefined as any, 'ARS', 1000)).rejects.toThrow('El destinatario no existe');
  });

  it('tira error si el destinatario no existe (por pin)', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });
    (findUserByPin as any).mockResolvedValueOnce(null);

    await expect(executeTransfer(1, undefined as any, '999999', 'ARS', 1000)).rejects.toThrow('El destinatario no existe');
  });

  it('tira error si el destinatario no tiene wallet', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });
    (findUserByEmail as any).mockResolvedValueOnce({ id: 2, email: 'destinatario@test.com' });
    (findWalletByUserId as any).mockResolvedValueOnce(null);

    await expect(executeTransfer(1, 'destinatario@test.com', undefined as any, 'ARS', 1000)).rejects.toThrow('El destinatario no tiene wallet');
  });

  it('tira error si intenta transferirse a sí mismo', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });
    (findUserByEmail as any).mockResolvedValueOnce({ id: 1, email: 'mismo@test.com' });
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });

    await expect(executeTransfer(1, 'mismo@test.com', undefined as any, 'ARS', 1000)).rejects.toThrow('No podés transferirte a vos mismo');
  });

  it('tira error si el saldo es insuficiente', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });
    (findUserByEmail as any).mockResolvedValueOnce({ id: 2, email: 'destinatario@test.com' });
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 2 });
    (findBalancesByWalletId as any).mockResolvedValueOnce([{ currency: 'ARS', amount: '100.00' }]);

    await expect(executeTransfer(1, 'destinatario@test.com', undefined as any, 'ARS', 1000)).rejects.toThrow('Saldo insuficiente');
  });
});

describe('confirmTransfer', () => {
  it('tira error si el token no existe', async () => {
    (findTransferByConfirmationToken as any).mockResolvedValueOnce(null);

    await expect(confirmTransfer('token-invalido')).rejects.toThrow('Token de confirmación inválido');
  });

  it('tira error si la transferencia ya fue procesada', async () => {
    (findTransferByConfirmationToken as any).mockResolvedValueOnce({ id: 1, status: 'success' });

    await expect(confirmTransfer('token-usado')).rejects.toThrow('Esta transferencia ya fue procesada');
  });

  it('marca como failed y tira error si el token expiró', async () => {
    const expiredDate = new Date(Date.now() - 60 * 60 * 1000);
    (findTransferByConfirmationToken as any).mockResolvedValueOnce({ id: 1, status: 'pending', expires_at: expiredDate });

    await expect(confirmTransfer('token-viejo')).rejects.toThrow('El link de confirmación expiró');
    expect(failPendingTransfer).toHaveBeenCalledWith(1);
  });
});

describe('getCombinedHistory', () => {
  it('tira error si la wallet no existe', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce(null);

    await expect(getCombinedHistory(1)).rejects.toThrow('Wallet no encontrada');
  });

  it('combina transacciones y transferencias ordenadas por fecha', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });
    (findTransactionsByWalletId as any).mockResolvedValueOnce([
      { id: 1, created_at: new Date('2026-01-01') },
    ]);
    (findTransfersByWalletId as any).mockResolvedValueOnce([
      { id: 1, from_wallet_id: 1, to_wallet_id: 2, created_at: new Date('2026-01-02') },
    ]);

    const result = await getCombinedHistory(1);

    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe('transfer');
    expect((result[0] as any).direction).toBe('sent');
    expect(result[1].kind).toBe('transaction');
  });
});