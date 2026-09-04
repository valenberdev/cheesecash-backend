import { describe, it, expect, vi } from 'vitest';
import { findUserByEmail, findUserByEmailWithPassword, findUserById, createUser } from '../../src/repositories/user.repository';
import { pool } from '../../src/config/db';

vi.mock('../../src/config/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('findUserByEmail', () => {
  it('devuelve el usuario cuando existe', async () => {
    const fakeUser = { id: 1, email: 'test@test.com', full_name: 'Test', created_at: new Date(), updated_at: new Date() };

    (pool.query as any).mockResolvedValueOnce({ rows: [fakeUser] });

    const result = await findUserByEmail('test@test.com');

    expect(result).toEqual(fakeUser);
  });

  it('devuelve null cuando no existe ningún usuario con ese email', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const result = await findUserByEmail('noexiste@test.com');

    expect(result).toBeNull();
  });

  it('llama a la query con el email correcto como parámetro', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    await findUserByEmail('alguien@test.com');

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE email = $1'),
      ['alguien@test.com']
    );
  });
});

describe('createUser', () => {
  it('inserta el usuario y devuelve los datos sin el hash', async () => {
    const fakeClient = {
      query: vi.fn().mockResolvedValueOnce({
        rows: [{ id: 1, email: 'nuevo@test.com', full_name: 'Nuevo', birth_date: new Date('2000-01-01'), user_pin: '123456', created_at: new Date(), updated_at: new Date() }],
      }),
    };

    const result = await createUser(fakeClient as any, 'nuevo@test.com', 'hasheado123', 'Nuevo', new Date('2000-01-01'), '123456');

    expect(result.email).toBe('nuevo@test.com');
    expect(fakeClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      ['nuevo@test.com', 'hasheado123', 'Nuevo', new Date('2000-01-01'), '123456']
    );
  });
});

describe('findUserByEmailWithPassword', () => {
  it('devuelve el usuario incluyendo el password_hash', async () => {
    const fakeUser = { id: 1, email: 'test@test.com', password_hash: 'hash123', full_name: 'Test', created_at: new Date(), updated_at: new Date() };

    (pool.query as any).mockResolvedValueOnce({ rows: [fakeUser] });

    const result = await findUserByEmailWithPassword('test@test.com');

    expect(result?.password_hash).toBe('hash123');
  });
});

describe('findUserById', () => {
  it('devuelve el usuario por id', async () => {
    const fakeUser = { id: 5, email: 'test@test.com', full_name: 'Test', auth_provider: 'local', created_at: new Date(), updated_at: new Date() };

    (pool.query as any).mockResolvedValueOnce({ rows: [fakeUser] });

    const result = await findUserById(5);

    expect(result?.id).toBe(5);
  });

  it('devuelve null si el id no existe', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    const result = await findUserById(999);

    expect(result).toBeNull();
  });
});