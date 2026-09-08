import { NotFoundError } from '../utils/errors';
import { findWalletByUserId } from '../repositories/wallet.repository';
import { findBalancesByWalletId } from '../repositories/balance.repository';

export async function getWalletBalances(userId: number) {
  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new NotFoundError('Wallet no encontrada');
  }

  const balances = await findBalancesByWalletId(wallet.id);

  return balances;
}