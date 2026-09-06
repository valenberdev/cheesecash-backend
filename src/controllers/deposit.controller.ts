import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { executeDeposit, getMyDeposits } from "../services/deposit.service";
import { formatAmount } from "../utils/formatAmount";

export async function createDepositEndpoint(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const { currency, amount, reference } = req.body;

    const deposit = await executeDeposit(req.userId, currency, amount, reference);

    res.status(201).json({
      ...deposit,
      amount: formatAmount(deposit.amount, deposit.currency),
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function getDepositsEndpoint(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const deposits = await getMyDeposits(req.userId);

    res.status(200).json(
      deposits.map((d) => ({
        ...d,
        amount: formatAmount(d.amount, d.currency),
      })),
    );
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
}