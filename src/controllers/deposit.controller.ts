import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { executeDeposit, getMyDeposits } from '../services/deposit.service';
import { formatAmount } from '../utils/formatAmount';
import { UnauthorizedError } from '../utils/errors';

export async function createDepositEndpoint(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const { currency, amount, reference } = req.body;

    const deposit = await executeDeposit(req.userId, currency, amount, reference);

    res.status(201).json({
      ...deposit,
      amount: formatAmount(deposit.amount, deposit.currency),
    });
  } catch (error) {
    next(error);
  }
}

export async function getDepositsEndpoint(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const deposits = await getMyDeposits(req.userId);

    res.status(200).json(
      deposits.map((d) => ({
        ...d,
        amount: formatAmount(d.amount, d.currency),
      })),
    );
  } catch (error) {
    next(error);
  }
}