import bcrypt from "bcryptjs";
import {
  findUserById,
  updateUserFullName,
  findUserByIdWithPassword,
  updateUserPassword,
  getUserThresholds,
  updateUserThresholds,
  getUserPin,
  setUserPin,
  generateUniquePin,
  findUserByPin,
} from "../repositories/user.repository";
import { validatePasswordLength } from "./auth.service";
import { NotFoundError, UnauthorizedError } from "../utils/errors";

export async function getUserProfile(userId: number) {
  const user = await findUserById(userId);

  if (!user) {
    throw new NotFoundError("Usuario no encontrado");
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
    throw new NotFoundError("Usuario no encontrado");
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.password_hash,
  );

  if (!passwordMatches) {
    throw new UnauthorizedError("Contraseña actual incorrecta");
  }

  validatePasswordLength(newPassword);

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await updateUserPassword(userId, newPasswordHash);
}

export async function getMyThresholds(userId: number) {
  const thresholds = await getUserThresholds(userId);

  if (!thresholds) {
    throw new NotFoundError("Usuario no encontrado");
  }

  return thresholds;
}

export async function updateMyThresholds(
  userId: number,
  ars: number,
  usd: number,
  eur: number,
  btcUsd: number,
) {
  await updateUserThresholds(userId, { ars, usd, eur, btcUsd });
}

export async function getMyPin(userId: number) {
  let pin = await getUserPin(userId);

  if (!pin) {
    pin = await generateUniquePin();
    await setUserPin(userId, pin);
  }

  return pin;
}

export async function lookupUserByPin(pin: string) {
  const user = await findUserByPin(pin);

  if (!user) {
    throw new NotFoundError('No se encontró ningún usuario con ese PIN');
  }

  return { fullName: user.full_name };
}
