import { pool } from "../config/db";

interface User {
  id: number;
  email: string;
  full_name: string;
  auth_provider: string;
  created_at: Date;
  updated_at: Date;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    "SELECT id, email, full_name, created_at, updated_at FROM users WHERE email = $1",
    [email],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function createUser(
  email: string,
  passwordHash: string,
  fullName: string,
): Promise<User> {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, created_at, updated_at`,
    [email, passwordHash, fullName],
  );

  return result.rows[0];
}

interface UserWithPassword extends User {
  password_hash: string;
}

export async function findUserByEmailWithPassword(
  email: string,
): Promise<UserWithPassword | null> {
  const result = await pool.query(
    "SELECT id, email, password_hash, full_name, created_at, updated_at FROM users WHERE email = $1",
    [email],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function findUserById(id: number): Promise<User | null> {
  const result = await pool.query(
    "SELECT id, email, full_name, auth_provider, created_at, updated_at FROM users WHERE id = $1",
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function updateUserFullName(
  id: number,
  fullName: string,
): Promise<User> {
  const result = await pool.query(
    `UPDATE users SET full_name = $1, updated_at = current_timestamp WHERE id = $2
     RETURNING id, email, full_name, auth_provider, created_at, updated_at`,
    [fullName, id],
  );

  return result.rows[0];
}

export async function findUserByIdWithPassword(
  id: number,
): Promise<UserWithPassword | null> {
  const result = await pool.query(
    "SELECT id, email, password_hash, full_name, created_at, updated_at FROM users WHERE id = $1",
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function updateUserPassword(
  id: number,
  passwordHash: string,
): Promise<void> {
  await pool.query(
    `UPDATE users SET password_hash = $1, updated_at = current_timestamp WHERE id = $2`,
    [passwordHash, id],
  );
}
