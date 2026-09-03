import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { executeTransfer, confirmTransfer, getCombinedHistory } from '../services/transfer.service';
import { formatAmount } from '../utils/formatAmount';

export async function createTransferEndpoint(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { toEmail, currency, amount } = req.body;

    const transfer = await executeTransfer(req.userId, toEmail, currency, amount);

    res.status(201).json({
      ...transfer,
      amount: formatAmount(transfer.amount, transfer.currency),
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function confirmTransferEndpoint(req: Request, res: Response) {
  try {
    const token = req.params.token as string;

    const transfer = await confirmTransfer(token);

    res.status(200).json({
      ...transfer,
      amount: formatAmount(transfer.amount, transfer.currency),
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function getFullHistory(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const history = await getCombinedHistory(req.userId);

    res.status(200).json(history);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
}