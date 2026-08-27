import { findUserById, updateUserFullName } from "../repositories/user.repository";

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
