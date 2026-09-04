import { describe, it, expect } from 'vitest';
import { formatAmount } from '../../src/utils/formatAmount';

describe('formatAmount', () => {
  it('redondea a 2 decimales para ARS', () => {
    expect(formatAmount(1234.5678, 'ARS')).toBe(1234.57);
  });

  it('redondea a 2 decimales para USD', () => {
    expect(formatAmount('99.999', 'USD')).toBe(100);
  });

  it('redondea a 6 decimales para BTC', () => {
    expect(formatAmount(0.123456789, 'BTC')).toBe(0.123457);
  });

  it('acepta un string como entrada y lo convierte a número', () => {
    expect(formatAmount('500.00000000', 'ARS')).toBe(500);
  });

  it('acepta un number como entrada directamente', () => {
    expect(formatAmount(500, 'ARS')).toBe(500);
  });

  it('devuelve 0 cuando el monto es 0', () => {
    expect(formatAmount(0, 'USD')).toBe(0);
  });
});