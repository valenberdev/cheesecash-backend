export function formatAmount(
  amount: string | number,
  currency: string,
): number {
  const decimals = currency === "BTC" ? 6 : 2;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return parseFloat(num.toFixed(decimals));
}
