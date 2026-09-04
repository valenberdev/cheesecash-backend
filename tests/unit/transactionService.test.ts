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

vi.mock('../../src/repositories/transaction.repository', () => ({
  createTransaction: vi.fn(),
  findTransactionsByWalletId: vi.fn(),
  createPendingTransaction: vi.fn(),
}));

vi.mock('../../src/repositories/user.repository', () => ({
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

import { executeTransaction, getTransactionHistory } from '../../src/services/transaction.service';
import { findWalletByUserId } from '../../src/repositories/wallet.repository';
import { findBalancesByWalletId, findBalancesByWalletIdForUpdate } from '../../src/repositories/balance.repository';
import { createPendingTransaction, findTransactionsByWalletId } from '../../src/repositories/transaction.repository';
import { getUserThresholds, findUserById } from '../../src/repositories/user.repository';
import { getExchangeRate } from '../../src/services/exchangeRate.service';
import { sendEmail } from '../../src/services/email.service';

beforeEach(() => {
  vi.clearAllMocks();
});

const defaultThresholds = {
  threshold_ars: '500000.00',
  threshold_usd: '500.00',
  threshold_eur: '500.00',
  threshold_btc_usd: '1000.00',
};

describe('executeTransaction', () => {
  it('tira error si la wallet no existe', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce(null);

    await expect(executeTransaction(1, 'exchange', 'ARS', 'USD', 1000)).rejects.toThrow('Wallet no encontrada');
  });

  it('tira error si el monto resultante es negativo o cero (queda por debajo del mínimo)', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });
    (getExchangeRate as any).mockResolvedValueOnce(0.0007);

    await expect(executeTransaction(1, 'exchange', 'ARS', 'USD', -100)).rejects.toThrow('El monto es demasiado bajo para esta operación');
  });

  it('tira error si el monto resultante es demasiado bajo', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });
    (getExchangeRate as any).mockResolvedValueOnce(0.0000001);

    await expect(executeTransaction(1, 'exchange', 'ARS', 'USD', 1)).rejects.toThrow('El monto es demasiado bajo para esta operación');
  });

  it('tira error si el saldo es insuficiente', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });
    (getExchangeRate as any).mockResolvedValueOnce(0.0007);
    (findBalancesByWalletId as any).mockResolvedValueOnce([{ currency: 'ARS', amount: '100.00' }]);

    await expect(executeTransaction(1, 'exchange', 'ARS', 'USD', 1000)).rejects.toThrow('Saldo insuficiente');
  });

  it('crea una transaccion pending y manda mail cuando supera el umbral', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });
    (getExchangeRate as any).mockResolvedValueOnce(0.0007);
    (findBalancesByWalletId as any).mockResolvedValueOnce([{ currency: 'ARS', amount: '1000000.00' }]);
    (getUserThresholds as any).mockResolvedValueOnce(defaultThresholds);
    (createPendingTransaction as any).mockResolvedValueOnce({ id: 1, status: 'pending' });
    (findUserById as any).mockResolvedValueOnce({ id: 1, email: 'test@test.com' });

    const result = await executeTransaction(1, 'exchange', 'ARS', 'USD', 600000);

    expect(result.status).toBe('pending');
    expect(sendEmail).toHaveBeenCalled();
  });
});

describe('getTransactionHistory', () => {
  it('tira error si la wallet no existe', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce(null);

    await expect(getTransactionHistory(1)).rejects.toThrow('Wallet no encontrada');
  });

  it('devuelve las transacciones de la wallet', async () => {
    (findWalletByUserId as any).mockResolvedValueOnce({ id: 1 });
    (findTransactionsByWalletId as any).mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

    const result = await getTransactionHistory(1);

    expect(result).toHaveLength(2);
  });
});