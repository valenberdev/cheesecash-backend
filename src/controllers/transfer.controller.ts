import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { executeTransfer, confirmTransfer, getCombinedHistory } from '../services/transfer.service';
import { formatAmount } from '../utils/formatAmount';
import { UnauthorizedError } from '../utils/errors';

export async function createTransferEndpoint(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const { toEmail, toPin, currency, amount } = req.body;

    const transfer = await executeTransfer(req.userId, toEmail, toPin, currency, amount);

    res.status(201).json({
      ...transfer,
      amount: formatAmount(transfer.amount, transfer.currency),
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmTransferEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.params.token as string;

    const transfer = await confirmTransfer(token);

    res.status(200).json({
      ...transfer,
      amount: formatAmount(transfer.amount, transfer.currency),
    });
  } catch (error) {
    next(error);
  }
}

export async function getFullHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const history = await getCombinedHistory(req.userId);

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
}