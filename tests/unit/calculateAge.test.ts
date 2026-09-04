import { describe, it, expect } from 'vitest';
import { calculateAge } from '../../src/services/auth.service';

describe('calculateAge', () => {
  it('devuelve la edad correcta cuando el cumpleaños ya pasó este año', () => {
    const birthDate = new Date('2000-03-15');
    const today = new Date('2026-09-01');

    expect(calculateAge(birthDate, today)).toBe(26);
  });

  it('resta un año cuando el cumpleaños todavía no llegó este año', () => {
    const birthDate = new Date('2000-12-15');
    const today = new Date('2026-09-01');

    expect(calculateAge(birthDate, today)).toBe(25);
  });

  it('cuenta el año nuevo el mismo día del cumpleaños', () => {
    const birthDate = new Date('2000-09-01');
    const today = new Date('2026-09-01');

    expect(calculateAge(birthDate, today)).toBe(26);
  });

  it('devuelve 0 para alguien que nació hace menos de un año', () => {
    const birthDate = new Date('2026-01-01');
    const today = new Date('2026-09-01');

    expect(calculateAge(birthDate, today)).toBe(0);
  });
});