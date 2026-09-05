const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares/oficial';
const DOLAR_CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutos

interface DolarApiResponse {
  compra: number;
  venta: number;
}

let dolarOficialCache: { compra: number; fetchedAt: number } | null = null;

export async function getDolarOficialCompra(): Promise<number> {
  const now = Date.now();

  if (dolarOficialCache && now - dolarOficialCache.fetchedAt < DOLAR_CACHE_DURATION_MS) {
    return dolarOficialCache.compra;
  }

  const response = await fetch(DOLAR_API_URL);

  if (!response.ok) {
    throw new Error('No se pudo obtener la cotización del dólar oficial');
  }

  const data: DolarApiResponse = await response.json();

  dolarOficialCache = { compra: data.compra, fetchedAt: now };

  return data.compra;
}

export function resetDolarOficialCache(): void {
  dolarOficialCache = null;
}