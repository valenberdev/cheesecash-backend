const FRANKFURTER_URL = "https://api.frankfurter.app";
const ARGENTINA_DATOS_URL =
  "https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial";
const COINGECKO_URL =
  process.env.COINGECKO_API_URL || "https://api.coingecko.com/api/v3";

const HISTORY_CACHE_DURATION_MS = 30 * 60 * 1000;

export const MAX_DAYS = 90;
export const MIN_DAYS = 1;

export interface RatePoint {
  date: string;
  rate: number;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

const cache = new Map<string, { value: Record<string, number>; fetchedAt: number }>();

export function resetRateHistoryCache(): void {
  cache.clear();
}

async function cached(
  key: string,
  loader: () => Promise<Record<string, number>>,
): Promise<Record<string, number>> {
  const hit = cache.get(key);

  if (hit && Date.now() - hit.fetchedAt < HISTORY_CACHE_DURATION_MS) {
    return hit.value;
  }

  const value = await loader();
  cache.set(key, { value, fetchedAt: Date.now() });

  return value;
}

async function getEurPerUsdSeries(days: number): Promise<Record<string, number>> {
  return cached(`eur:${days}`, async () => {
    const start = toISODate(daysAgo(days));
    const end = toISODate(new Date());

    const response = await fetch(
      `${FRANKFURTER_URL}/${start}..${end}?from=USD&to=EUR`,
    );

    if (!response.ok) {
      throw new Error("No se pudo obtener el histórico de EUR");
    }

    const data = (await response.json()) as {
      rates: Record<string, { EUR: number }>;
    };

    const out: Record<string, number> = {};

    for (const [date, value] of Object.entries(data.rates ?? {})) {
      if (typeof value?.EUR === "number") {
        out[date] = value.EUR;
      }
    }

    return out;
  });
}

async function getArsPerUsdSeries(days: number): Promise<Record<string, number>> {
  return cached(`ars:${days}`, async () => {
    const response = await fetch(ARGENTINA_DATOS_URL);

    if (!response.ok) {
      throw new Error("No se pudo obtener el histórico del dólar oficial");
    }

    const data = (await response.json()) as {
      fecha: string;
      compra: number;
    }[];

    const desde = toISODate(daysAgo(days));
    const out: Record<string, number> = {};

    for (const row of data ?? []) {
      if (row?.fecha >= desde && typeof row.compra === "number") {
        out[row.fecha] = row.compra;
      }
    }

    return out;
  });
}

async function getBtcUsdSeries(days: number): Promise<Record<string, number>> {
  return cached(`btc:${days}`, async () => {
    const response = await fetch(
      `${COINGECKO_URL}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`,
    );

    if (!response.ok) {
      throw new Error("No se pudo obtener el histórico de BTC");
    }

    const data = (await response.json()) as { prices: [number, number][] };
    const out: Record<string, number> = {};

    for (const [ms, price] of data.prices ?? []) {
      out[toISODate(new Date(ms))] = price;
    }

    return out;
  });
}


async function getUsdValueSeries(
  currency: string,
  days: number,
): Promise<Record<string, number> | null> {
  if (currency === "USD") {
    return null;
  }

  if (currency === "EUR") {
    const eurPerUsd = await getEurPerUsdSeries(days);
    return invert(eurPerUsd);
  }

  if (currency === "ARS") {
    const arsPerUsd = await getArsPerUsdSeries(days);
    return invert(arsPerUsd);
  }

  if (currency === "BTC") {
    return getBtcUsdSeries(days);
  }

  throw new Error("Moneda no soportada");
}

function invert(series: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};

  for (const [date, value] of Object.entries(series)) {
    if (value > 0) {
      out[date] = 1 / value;
    }
  }

  return out;
}

export async function getRateHistory(
  fromCurrency: string,
  toCurrency: string,
  days: number,
): Promise<RatePoint[]> {
  const fromSeries = await getUsdValueSeries(fromCurrency, days);
  const toSeries = await getUsdValueSeries(toCurrency, days);

  const dates =
    fromSeries && toSeries
      ? Object.keys(fromSeries).filter((d) => d in toSeries)
      : Object.keys(fromSeries ?? toSeries ?? {});

  const points: RatePoint[] = [];

  for (const date of dates.sort()) {
    const from = fromSeries ? fromSeries[date] : 1;
    const to = toSeries ? toSeries[date] : 1;

    if (from > 0 && to > 0) {
      points.push({ date, rate: from / to });
    }
  }

  return points;
}