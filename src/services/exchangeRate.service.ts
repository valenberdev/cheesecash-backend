import { getBtcPriceInUsd } from './coingecko.service';

const EXCHANGE_RATE_API_URL = 'https://v6.exchangerate-api.com/v6';
const FIAT_CACHE_DURATION_MS = 60 * 60 * 1000; 

interface ExchangeRateResponse {
  result: string;
  conversion_rates: Record<string, number>;
}

let fiatRatesCache: { rates: Record<string, number>; fetchedAt: number } | null = null;

export async function getFiatRates(): Promise<Record<string, number>> {
  const now = Date.now();

  if (fiatRatesCache && now - fiatRatesCache.fetchedAt < FIAT_CACHE_DURATION_MS) {
    return fiatRatesCache.rates;
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  const response = await fetch(`${EXCHANGE_RATE_API_URL}/${apiKey}/latest/USD`);

  if (!response.ok) {
    throw new Error('No se pudo obtener las tasas de cambio');
  }

  const data: ExchangeRateResponse = await response.json();

  if (data.result !== 'success') {
    throw new Error('Error en la respuesta de ExchangeRate-API');
  }

  fiatRatesCache = { rates: data.conversion_rates, fetchedAt: now };

  return data.conversion_rates;
}


const FIAT_CURRENCIES = ['ARS', 'USD', 'EUR'];

export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const fiatRates = await getFiatRates();
  const rates: Record<string, number> = { ...fiatRates, USD: 1 };

  const fromIsBtc = fromCurrency === 'BTC';
  const toIsBtc = toCurrency === 'BTC';

  if (!fromIsBtc && !toIsBtc) {
    const fromRateToUsd = rates[fromCurrency];
    const toRateFromUsd = rates[toCurrency];

    return toRateFromUsd / fromRateToUsd;
  }

  const btcPriceInUsd = await getBtcPriceInUsd();

  if (fromIsBtc && !toIsBtc) {
    return btcPriceInUsd * rates[toCurrency];
  }

  if (!fromIsBtc && toIsBtc) {
    const fromRateToUsd = rates[fromCurrency];
    const amountInUsd = 1 / fromRateToUsd;

    return amountInUsd / btcPriceInUsd;
  }

  throw new Error('Combinación de monedas no soportada');
}