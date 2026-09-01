import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  findUserByEmail,
  createUser,
  findUserByEmailWithPassword,
  setResetToken,
  findUserByResetToken,
  resetPassword
} from "../repositories/user.repository";
import { createInitialBalances } from "../repositories/balance.repository";
import { createWallet } from "../repositories/wallet.repository";
import { findUserByGoogleId, linkGoogleAccount, createGoogleUser } from '../repositories/user.repository';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { sendEmail } from './email.service';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function registerUser(
  email: string,
  password: string,
  fullName: string,
) {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error("El email ya está registrado");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await createUser(email, passwordHash, fullName);

  const wallet = await createWallet(newUser.id);

  await createInitialBalances(wallet.id);

  return newUser;
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmailWithPassword(email);

  if (!user) {
    throw new Error("Credenciales inválidas");
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw new Error("Credenciales inválidas");
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );

  const { password_hash, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
}

export async function loginWithGoogle(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.sub) {
    throw new Error("Token de Google inválido");
  }

  const googleId = payload.sub;
  const email = payload.email;
  const fullName = payload.name || email;

  let user = await findUserByGoogleId(googleId);

  if (!user) {
    const existingUserByEmail = await findUserByEmail(email);

    if (existingUserByEmail) {
      await linkGoogleAccount(existingUserByEmail.id, googleId);
      user = existingUserByEmail;
    } else {
      user = await createGoogleUser(email, fullName, googleId);

      const wallet = await createWallet(user.id);
      await createInitialBalances(wallet.id);
    }
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" },
  );

  return { token, user };
}


export async function requestPasswordReset(email: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await setResetToken(email, token, expiresAt);

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail(
    email,
    'Recuperación de contraseña - CheeseCash',
    `<p>Hacé click en el siguiente link para restablecer tu contraseña. El link vence en 1 hora.</p>
     <p><a href="${resetLink}">Restablecer contraseña</a></p>`
  );
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const user = await findUserByResetToken(token);

  if (!user || user.reset_token_expires < new Date()) {
    throw new Error('Token inválido o expirado');
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await resetPassword(user.id, newPasswordHash);
}