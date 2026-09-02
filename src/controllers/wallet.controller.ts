import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getWalletBalances } from "../services/wallet.service";
import { formatAmount } from "../utils/formatAmount";

export async function getBalances(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const balances = await getWalletBalances(req.userId);

    const formatted = balances.map((b) => ({
      ...b,
      amount: formatAmount(b.amount, b.currency),
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
}