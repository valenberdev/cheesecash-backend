import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRateHistory, resetRateHistoryCache } from '../../src/services/rateHistory.service';

/** Respuestas de las tres APIs externas, con la forma que documentan. */
const frankfurter = {
  ok: true,
  json: async () => ({
    rates: {
      '2026-09-01': { EUR: 0.9 },
      '2026-09-02': { EUR: 0.95 },
    },
  }),
};

const argentinaDatos = {
  ok: true,
  json: async () => [
    { fecha: '2026-09-01', compra: 1000 },
    { fecha: '2026-09-02', compra: 1200 },
  ],
};

const coingecko = {
  ok: true,
  json: async () => ({
    prices: [
      [Date.UTC(2026, 8, 1), 60000],
      [Date.UTC(2026, 8, 2), 62000],
    ],
  }),
};

describe('getRateHistory', () => {
  beforeEach(() => {
    // El servicio filtra por fecha relativa a hoy, así que congelamos el
    // reloj para que las fechas de prueba caigan siempre dentro del rango.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-03T12:00:00Z'));
    resetRateHistoryCache();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('USD a ARS devuelve el dolar oficial de cada dia', async () => {
    (globalThis.fetch as any).mockResolvedValue(argentinaDatos);

    const points = await getRateHistory('USD', 'ARS', 7);

    expect(points).toEqual([
      { date: '2026-09-01', rate: 1000 },
      { date: '2026-09-02', rate: 1200 },
    ]);
  });

  it('ARS a USD es el inverso', async () => {
    (globalThis.fetch as any).mockResolvedValue(argentinaDatos);

    const points = await getRateHistory('ARS', 'USD', 7);

    expect(points[0].rate).toBeCloseTo(0.001);
    expect(points[1].rate).toBeCloseTo(1 / 1200);
  });

  it('USD a EUR usa la serie de Frankfurter', async () => {
    (globalThis.fetch as any).mockResolvedValue(frankfurter);

    const points = await getRateHistory('USD', 'EUR', 7);

    expect(points[0].date).toBe('2026-09-01');
    expect(points[0].rate).toBeCloseTo(0.9);
    expect(points[1].rate).toBeCloseTo(0.95);
  });

  it('BTC a USD devuelve el precio de cada dia', async () => {
    (globalThis.fetch as any).mockResolvedValue(coingecko);

    const points = await getRateHistory('BTC', 'USD', 7);

    expect(points).toEqual([
      { date: '2026-09-01', rate: 60000 },
      { date: '2026-09-02', rate: 62000 },
    ]);
  });

  it('combina dos series para un par sin dolar de por medio', async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('coingecko')) return Promise.resolve(coingecko);
      return Promise.resolve(argentinaDatos);
    });

    const points = await getRateHistory('BTC', 'ARS', 7);

    // 1 BTC = 60000 USD y 1 USD = 1000 ARS => 60.000.000 ARS
    expect(points[0].rate).toBeCloseTo(60_000_000);
    expect(points[1].rate).toBeCloseTo(62000 * 1200);
  });

  it('descarta las fechas que no estan en las dos series', async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('coingecko')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ prices: [[Date.UTC(2026, 8, 2), 62000]] }),
        });
      }
      return Promise.resolve(argentinaDatos);
    });

    const points = await getRateHistory('BTC', 'ARS', 7);

    expect(points).toHaveLength(1);
    expect(points[0].date).toBe('2026-09-02');
  });

  it('propaga el error si una fuente falla', async () => {
    (globalThis.fetch as any).mockResolvedValue({ ok: false });

    await expect(getRateHistory('USD', 'ARS', 7)).rejects.toThrow(
      'No se pudo obtener el histórico del dólar oficial',
    );
  });

  it('no vuelve a pedir la misma serie dentro del cache', async () => {
    (globalThis.fetch as any).mockResolvedValue(argentinaDatos);

    await getRateHistory('USD', 'ARS', 7);
    await getRateHistory('USD', 'ARS', 7);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});