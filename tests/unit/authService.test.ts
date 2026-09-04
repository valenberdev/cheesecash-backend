import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginUser } from '../../src/services/auth.service';
import { findUserByEmailWithPassword } from '../../src/repositories/user.repository';
import bcrypt from 'bcryptjs';
import { requestPasswordReset, confirmPasswordReset } from '../../src/services/auth.service';
import { setResetToken, findUserByResetToken, resetPassword } from '../../src/repositories/user.repository';
import { sendEmail } from '../../src/services/email.service';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hash-simulado'),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('jwt-simulado'),
  },
}));

vi.mock('../../src/repositories/user.repository', () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  generateUniquePin: vi.fn(),
  findUserByEmailWithPassword: vi.fn(),
  findUserByGoogleId: vi.fn(),
  linkGoogleAccount: vi.fn(),
  createGoogleUser: vi.fn(),
  setResetToken: vi.fn(),
  findUserByResetToken: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock('../../src/repositories/wallet.repository', () => ({
  createWallet: vi.fn(),
}));

vi.mock('../../src/repositories/balance.repository', () => ({
  createInitialBalances: vi.fn(),
}));

vi.mock('../../src/config/db', () => ({
  pool: {
    connect: vi.fn().mockResolvedValue({
      query: vi.fn(),
      release: vi.fn(),
    }),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hash-simulado'),
    compare: vi.fn(),
  },
}));

vi.mock('../../src/services/email.service', () => ({
  sendEmail: vi.fn(),
  sendTransactionReceiptEmail: vi.fn(),
}));

import { registerUser } from '../../src/services/auth.service';
import { findUserByEmail, createUser, generateUniquePin } from '../../src/repositories/user.repository';
import { createWallet } from '../../src/repositories/wallet.repository';
import { createInitialBalances } from '../../src/repositories/balance.repository';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registerUser', () => {
  it('tira error si la contraseña tiene menos de 8 caracteres', async () => {
    await expect(
      registerUser('test@test.com', '123', 'Test', new Date('2000-01-01'))
    ).rejects.toThrow('La contraseña debe tener al menos 8 caracteres');
  });

  it('tira error si el usuario es menor de 18 años', async () => {
    const recentBirthDate = new Date();
    recentBirthDate.setFullYear(recentBirthDate.getFullYear() - 10);

    await expect(
      registerUser('test@test.com', 'password123', 'Test', recentBirthDate)
    ).rejects.toThrow('Debés ser mayor de 18 años para registrarte');
  });

  it('tira error si el email ya está registrado', async () => {
    (findUserByEmail as any).mockResolvedValueOnce({ id: 1, email: 'test@test.com' });

    await expect(
      registerUser('test@test.com', 'password123', 'Test', new Date('2000-01-01'))
    ).rejects.toThrow('El email ya está registrado');
  });

  it('crea el usuario, wallet y balances cuando todo es válido', async () => {
    (findUserByEmail as any).mockResolvedValueOnce(null);
    (generateUniquePin as any).mockResolvedValueOnce('123456');
    (createUser as any).mockResolvedValueOnce({ id: 1, email: 'test@test.com' });
    (createWallet as any).mockResolvedValueOnce({ id: 10 });

    const result = await registerUser('test@test.com', 'password123', 'Test', new Date('2000-01-01'));

    expect(result.email).toBe('test@test.com');
    expect(createWallet).toHaveBeenCalledWith(expect.anything(), 1);
    expect(createInitialBalances).toHaveBeenCalledWith(expect.anything(), 10);
  });
});

describe('loginUser', () => {
  it('tira error si el usuario no existe', async () => {
    (findUserByEmailWithPassword as any).mockResolvedValueOnce(null);

    await expect(loginUser('noexiste@test.com', 'password123')).rejects.toThrow('Credenciales inválidas');
  });

  it('tira error si la contraseña no coincide', async () => {
    (findUserByEmailWithPassword as any).mockResolvedValueOnce({ id: 1, email: 'test@test.com', password_hash: 'hash-real' });
    (bcrypt.compare as any).mockResolvedValueOnce(false);

    await expect(loginUser('test@test.com', 'incorrecta')).rejects.toThrow('Credenciales inválidas');
  });

  it('devuelve token y usuario sin el hash cuando las credenciales son correctas', async () => {
    (findUserByEmailWithPassword as any).mockResolvedValueOnce({ id: 1, email: 'test@test.com', password_hash: 'hash-real', full_name: 'Test' });
    (bcrypt.compare as any).mockResolvedValueOnce(true);

    const result = await loginUser('test@test.com', 'password123');

    expect(result.token).toBe('jwt-simulado');
    expect(result.user).not.toHaveProperty('password_hash');
    expect(result.user.email).toBe('test@test.com');
  });
});

describe('requestPasswordReset', () => {
  it('no hace nada ni tira error si el email no existe', async () => {
    (findUserByEmail as any).mockResolvedValueOnce(null);

    await requestPasswordReset('noexiste@test.com');

    expect(setResetToken).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('genera el token, lo guarda, y manda el mail si el email existe', async () => {
    (findUserByEmail as any).mockResolvedValueOnce({ id: 1, email: 'test@test.com' });

    await requestPasswordReset('test@test.com');

    expect(setResetToken).toHaveBeenCalledWith('test@test.com', expect.any(String), expect.any(Date));
    expect(sendEmail).toHaveBeenCalledWith('test@test.com', expect.stringContaining('Recuperación'), expect.any(String));
  });
});

describe('confirmPasswordReset', () => {
  it('tira error si el token no existe', async () => {
    (findUserByResetToken as any).mockResolvedValueOnce(null);

    await expect(confirmPasswordReset('token-invalido', 'nuevaPassword123')).rejects.toThrow('Token inválido o expirado');
  });

  it('tira error si el token ya expiró', async () => {
    const expiredDate = new Date(Date.now() - 60 * 60 * 1000);
    (findUserByResetToken as any).mockResolvedValueOnce({ id: 1, reset_token_expires: expiredDate });

    await expect(confirmPasswordReset('token-viejo', 'nuevaPassword123')).rejects.toThrow('Token inválido o expirado');
  });

  it('tira error si la nueva contraseña es muy corta', async () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    (findUserByResetToken as any).mockResolvedValueOnce({ id: 1, reset_token_expires: futureDate });

    await expect(confirmPasswordReset('token-valido', '123')).rejects.toThrow('La contraseña debe tener al menos 8 caracteres');
  });

  it('actualiza la contraseña cuando el token es válido y no expiró', async () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    (findUserByResetToken as any).mockResolvedValueOnce({ id: 1, reset_token_expires: futureDate });

    await confirmPasswordReset('token-valido', 'nuevaPassword123');

    expect(resetPassword).toHaveBeenCalledWith(1, 'hash-simulado');
  });
});