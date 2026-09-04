import { describe, it, expect } from 'vitest';
import { validatePasswordLength } from '../../src/services/auth.service';

describe('validatePasswordLength', () => {
  it('no tira error con una contraseña de 8 caracteres o más', () => {
    expect(() => validatePasswordLength('password123')).not.toThrow();
  });

  it('tira error con una contraseña de menos de 8 caracteres', () => {
    expect(() => validatePasswordLength('123')).toThrow('La contraseña debe tener al menos 8 caracteres');
  });

  it('tira error con una contraseña vacía', () => {
    expect(() => validatePasswordLength('')).toThrow();
  });

  it('no tira error con una contraseña de exactamente 8 caracteres (caso límite)', () => {
    expect(() => validatePasswordLength('12345678')).not.toThrow();
  });
});