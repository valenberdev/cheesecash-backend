import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBtcPriceInUsd, resetBtcPriceCache } from '../../src/services/coingecko.service';

describe('getBtcPriceInUsd', () => {
  beforeEach(() => {
    resetBtcPriceCache();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('devuelve el precio de BTC desde la API', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bitcoin: { usd: 62000 } }),
    });

    const price = await getBtcPriceInUsd();

    expect(price).toBe(62000);
  });

  it('tira error si la respuesta de la API no es ok', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({ ok: false });

    await expect(getBtcPriceInUsd()).rejects.toThrow('No se pudo obtener el precio de BTC');
  });

  it('usa el cache en la segunda llamada, sin volver a golpear la API', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bitcoin: { usd: 70000 } }),
    });

    const firstCall = await getBtcPriceInUsd();
    const secondCall = await getBtcPriceInUsd();

    expect(firstCall).toBe(70000);
    expect(secondCall).toBe(70000);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});