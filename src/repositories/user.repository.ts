import { pool } from "../config/db";
import { PoolClient } from "pg";

interface User {
  id: number;
  email: string;
  full_name: string;
  auth_provider: string;
  birth_date: Date | null;
  created_at: Date;
  updated_at: Date;
  user_pin: string | null;
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
  client: PoolClient,
  email: string,
  passwordHash: string,
  fullName: string,
  birthDate: Date,
  userPin: string,
): Promise<User> {
  const result = await client.query(
    `INSERT INTO users (email, password_hash, full_name, birth_date, user_pin)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, full_name, birth_date, user_pin, created_at, updated_at`,
    [email, passwordHash, fullName, birthDate, userPin],
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

export async function findUserByGoogleId(
  googleId: string,
): Promise<User | null> {
  const result = await pool.query(
    "SELECT id, email, full_name, auth_provider, created_at, updated_at FROM users WHERE google_id = $1",
    [googleId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function linkGoogleAccount(
  userId: number,
  googleId: string,
): Promise<void> {
  await pool.query(
    `UPDATE users SET google_id = $1, updated_at = current_timestamp WHERE id = $2`,
    [googleId, userId],
  );
}

export async function createGoogleUser(
  client: PoolClient,
  email: string,
  fullName: string,
  googleId: string,
): Promise<User> {
  const result = await client.query(
    `INSERT INTO users (email, full_name, google_id, auth_provider)
     VALUES ($1, $2, $3, 'google')
     RETURNING id, email, full_name, auth_provider, created_at, updated_at`,
    [email, fullName, googleId],
  );

  return result.rows[0];
}

export async function setResetToken(
  email: string,
  token: string,
  expiresAt: Date,
): Promise<void> {
  await pool.query(
    `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3`,
    [token, expiresAt, email],
  );
}

interface UserWithResetToken extends User {
  reset_token_expires: Date;
}

export async function findUserByResetToken(
  token: string,
): Promise<UserWithResetToken | null> {
  const result = await pool.query(
    "SELECT id, email, full_name, auth_provider, reset_token_expires, created_at, updated_at FROM users WHERE reset_token = $1",
    [token],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function resetPassword(
  userId: number,
  newPasswordHash: string,
): Promise<void> {
  await pool.query(
    `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = current_timestamp WHERE id = $2`,
    [newPasswordHash, userId],
  );
}

export async function getUserThresholds(userId: number) {
  const result = await pool.query(
    "SELECT threshold_ars, threshold_usd, threshold_eur, threshold_btc_usd FROM users WHERE id = $1",
    [userId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function updateUserThresholds(
  userId: number,
  thresholds: { ars: number; usd: number; eur: number; btcUsd: number },
): Promise<void> {
  await pool.query(
    `UPDATE users SET threshold_ars = $1, threshold_usd = $2, threshold_eur = $3, threshold_btc_usd = $4, updated_at = current_timestamp WHERE id = $5`,
    [thresholds.ars, thresholds.usd, thresholds.eur, thresholds.btcUsd, userId],
  );
}

function generateRandomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generateUniquePin(): Promise<string> {
  let pin = generateRandomPin();
  let exists = true;

  while (exists) {
    const result = await pool.query(
      "SELECT id FROM users WHERE user_pin = $1",
      [pin],
    );
    exists = result.rows.length > 0;

    if (exists) {
      pin = generateRandomPin();
    }
  }

  return pin;
}

export async function getUserPin(userId: number): Promise<string | null> {
  const result = await pool.query("SELECT user_pin FROM users WHERE id = $1", [
    userId,
  ]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].user_pin;
}

export async function setUserPin(userId: number, pin: string): Promise<void> {
  await pool.query(
    `UPDATE users SET user_pin = $1, updated_at = current_timestamp WHERE id = $2`,
    [pin, userId],
  );
}

export async function findUserByPin(pin: string): Promise<User | null> {
  const result = await pool.query(
    "SELECT id, email, full_name, created_at, updated_at FROM users WHERE user_pin = $1",
    [pin],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}
