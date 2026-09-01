import { Request, Response } from "express";
import { getExchangeRate, getAllRates } from "../services/exchangeRate.service";

export async function getRates(req: Request, res: Response) {
  try {
    const { from, to } = req.query;

    if (from && to) {
      const rate = await getExchangeRate(from as string, to as string);
      res.status(200).json({ from, to, rate });
      return;
    }

    const rates = await getAllRates();
    res.status(200).json(rates);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
