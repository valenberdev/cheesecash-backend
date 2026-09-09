import { Request, Response, NextFunction } from 'express';
import { getExchangeRate, getAllRates } from '../services/exchangeRate.service';
import { getRateHistory, MAX_DAYS, MIN_DAYS } from '../services/rateHistory.service';

const SUPPORTED = ['ARS', 'USD', 'EUR', 'BTC'];

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

export async function getRatesHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const from = String(req.query.from ?? '').toUpperCase();
    const to = String(req.query.to ?? '').toUpperCase();
    const days = Number(req.query.days ?? 7);

    if (!SUPPORTED.includes(from) || !SUPPORTED.includes(to)) {
      res.status(400).json({ error: 'Moneda no soportada' });
      return;
    }

    if (from === to) {
      res.status(400).json({ error: 'Las monedas deben ser distintas' });
      return;
    }

    if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
      res.status(400).json({ error: `days debe ser un entero entre ${MIN_DAYS} y ${MAX_DAYS}` });
      return;
    }

    const points = await getRateHistory(from, to, days);

    res.status(200).json({ from, to, days, points });
  } catch (error) {
    next(error);
  }
}