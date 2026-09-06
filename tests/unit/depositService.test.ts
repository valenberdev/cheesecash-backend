import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeDeposit } from '../../src/services/deposit.service';
import { findWalletByUserId } from '../../src/repositories/wallet.repository';
import { adjustBalance } from '../../src/repositories/balance.repository';
import {
  createDeposit,
  findDepositByReference,
} from '../../src/repositories/deposit.repository';
import { pool } from '../../src/config/db';

vi.mock('../../src/config/db', () => ({
  pool: { connect: vi.fn(), query: vi.fn() },
}));
vi.mock('../../src/config/socket', () => ({
  io: { to: vi.fn(() => ({ emit: vi.fn() })) },
}));
vi.mock('../../src/repositories/wallet.repository', () => ({
  findWalletByUserId: vi.fn(),
}));
vi.mock('../../src/repositories/balance.repository', () => ({
  adjustBalance: vi.fn(),
}));
vi.mock('../../src/repositories/deposit.repository', () => ({
  createDeposit: vi.fn(),
  findDepositByReference: vi.fn(),
  findDepositsByWalletId: vi.fn(),
}));

const client = { query: vi.fn(), release: vi.fn() };

const fakeDeposit = {
  id: 1, wallet_id: 10, currency: 'ARS',
  amount: '50000', reference: 'ref-123', status: 'success',
  created_at: new Date(),
};

describe('executeDeposit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (pool.connect as any).mockResolvedValue(client);
    (findWalletByUserId as any).mockResolvedValue({ id: 10, user_id: 1 });
    (findDepositByReference as any).mockResolvedValue(null);
    (createDeposit as any).mockResolvedValue(fakeDeposit);
  });

  it('rechaza montos menores o iguales a cero', async () => {
    await expect(executeDeposit(1, 'ARS', 0)).rejects.toThrow(
      'El monto debe ser mayor a cero',
    );
    await expect(executeDeposit(1, 'ARS', -100)).rejects.toThrow(
      'El monto debe ser mayor a cero',
    );
  });

  it('rechaza montos por encima del tope de la moneda', async () => {
    await expect(executeDeposit(1, 'USD', 999999)).rejects.toThrow(
      /máximo por operación/,
    );
  });

  it('falla si el usuario no tiene wallet', async () => {
    (findWalletByUserId as any).mockResolvedValue(null);

    await expect(executeDeposit(1, 'ARS', 1000)).rejects.toThrow(
      'Wallet no encontrada',
    );
  });

  it('acredita el saldo dentro de una transacción', async () => {
    await executeDeposit(1, 'ARS', 50000);

    expect(client.query).toHaveBeenCalledWith('BEGIN');
    expect(adjustBalance).toHaveBeenCalledWith(client, 10, 'ARS', 50000);
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('no acredita dos veces el mismo depósito', async () => {
    (findDepositByReference as any).mockResolvedValue(fakeDeposit);

    const result = await executeDeposit(1, 'ARS', 50000, 'ref-123');

    expect(result).toEqual(fakeDeposit);
    expect(adjustBalance).not.toHaveBeenCalled();
    expect(createDeposit).not.toHaveBeenCalled();
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it('revierte todo si falla al acreditar el saldo', async () => {
    (adjustBalance as any).mockRejectedValue(new Error('fallo en la base'));

    await expect(executeDeposit(1, 'ARS', 1000)).rejects.toThrow('fallo en la base');

    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });
});