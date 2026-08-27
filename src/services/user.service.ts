import { findUserById } from '../repositories/user.repository';

export async function getUserProfile(userId: number) {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return user;
}