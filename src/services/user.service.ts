import bcrypt from "bcryptjs";
import {
  findUserById,
  updateUserFullName,
  findUserByIdWithPassword,
  updateUserPassword,getUserThresholds, updateUserThresholds
} from "../repositories/user.repository";
import {
  findUserByGoogleId,
  linkGoogleAccount,
  createGoogleUser,
} from "../repositories/user.repository";
import { OAuth2Client } from "google-auth-library";
import { validatePasswordLength } from './auth.service';

export async function getUserProfile(userId: number) {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  return user;
}

export async function updateUserProfile(userId: number, fullName: string) {
  const updatedUser = await updateUserFullName(userId, fullName);

  return updatedUser;
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
) {
  const user = await findUserByIdWithPassword(userId);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.password_hash,
  );

  if (!passwordMatches) {
    throw new Error("Contraseña actual incorrecta");
  }

  validatePasswordLength(newPassword);

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await updateUserPassword(userId, newPasswordHash);
}

export async function getMyThresholds(userId: number) {
  const thresholds = await getUserThresholds(userId);

  if (!thresholds) {
    throw new Error('Usuario no encontrado');
  }

  return thresholds;
}

export async function updateMyThresholds(
  userId: number,
  ars: number,
  usd: number,
  eur: number,
  btcUsd: number
) {
  await updateUserThresholds(userId, { ars, usd, eur, btcUsd });
}