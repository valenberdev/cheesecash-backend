import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getWalletBalances } from "../services/wallet.service";

export async function getBalances(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const balances = await getWalletBalances(req.userId);

    res.status(200).json(balances);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
}
