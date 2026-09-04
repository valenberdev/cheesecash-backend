const COINGECKO_API_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const BTC_CACHE_DURATION_MS = 3 * 60 * 1000;

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
  };
}

let btcPriceCache: { price: number; fetchedAt: number } | null = null;

export function resetBtcPriceCache(): void {
  btcPriceCache = null;
}

export async function getBtcPriceInUsd(): Promise<number> {
  const now = Date.now();

  if (btcPriceCache && now - btcPriceCache.fetchedAt < BTC_CACHE_DURATION_MS) {
    return btcPriceCache.price;
  }

  const response = await fetch(`${COINGECKO_API_URL}/simple/price?ids=bitcoin&vs_currencies=usd`);

  if (!response.ok) {
    throw new Error('No se pudo obtener el precio de BTC');
  }

  const data: CoinGeckoResponse = await response.json();

  btcPriceCache = { price: data.bitcoin.usd, fetchedAt: now };

  return data.bitcoin.usd;
}