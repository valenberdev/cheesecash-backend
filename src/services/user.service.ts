import bcrypt from "bcryptjs";
import {
  findUserById,
  updateUserFullName,
  findUserByIdWithPassword,
  updateUserPassword,
} from "../repositories/user.repository";

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

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await updateUserPassword(userId, newPasswordHash);
}
