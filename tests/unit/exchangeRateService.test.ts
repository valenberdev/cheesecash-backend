import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFiatRates, getExchangeRate, resetFiatRatesCache } from '../../src/services/exchangeRate.service';
import * as coingeckoService from '../../src/services/coingecko.service';

vi.mock('../../src/services/coingecko.service', () => ({
  getBtcPriceInUsd: vi.fn(),
}));

describe('getFiatRates', () => {
  beforeEach(() => {
    resetFiatRatesCache();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('devuelve las tasas fiat desde la API', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'success', conversion_rates: { ARS: 1450, EUR: 0.92 } }),
    });

    const rates = await getFiatRates();

    expect(rates.ARS).toBe(1450);
  });

  it('tira error si la API responde con result distinto de success', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'error' }),
    });

    await expect(getFiatRates()).rejects.toThrow('Error en la respuesta de ExchangeRate-API');
  });

  it('tira error si la respuesta HTTP no es ok', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({ ok: false });

    await expect(getFiatRates()).rejects.toThrow('No se pudo obtener las tasas de cambio');
  });
});

describe('getExchangeRate', () => {
  beforeEach(() => {
    resetFiatRatesCache();
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(coingeckoService.getBtcPriceInUsd).mockReset();
  });

  it('devuelve 1 cuando ambas monedas son iguales', async () => {
    const rate = await getExchangeRate('ARS', 'ARS');

    expect(rate).toBe(1);
  });

  it('calcula la tasa entre dos monedas fiat', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'success', conversion_rates: { ARS: 1450, EUR: 0.92 } }),
    });

    const rate = await getExchangeRate('USD', 'ARS');

    expect(rate).toBe(1450);
  });

  it('calcula la tasa de BTC a fiat', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'success', conversion_rates: { ARS: 1450 } }),
    });
    vi.mocked(coingeckoService.getBtcPriceInUsd).mockResolvedValueOnce(62000);

    const rate = await getExchangeRate('BTC', 'ARS');

    expect(rate).toBe(62000 * 1450);
  });

  it('calcula la tasa de fiat a BTC', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'success', conversion_rates: { ARS: 1450 } }),
    });
    vi.mocked(coingeckoService.getBtcPriceInUsd).mockResolvedValueOnce(62000);

    const rate = await getExchangeRate('ARS', 'BTC');

    const expectedRate = (1 / 1450) / 62000;
    expect(rate).toBeCloseTo(expectedRate, 15);
  });
});