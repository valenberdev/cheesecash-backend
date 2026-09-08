import { Request, Response, NextFunction } from 'express';
import { getExchangeRate, getAllRates } from '../services/exchangeRate.service';

export async function getRates(req: Request, res: Response, next: NextFunction) {
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
    next(error);
  }
}