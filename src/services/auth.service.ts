import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "../repositories/user.repository";
import { createInitialBalances } from "../repositories/balance.repository";

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

  await createInitialBalances(newUser.id)

  return newUser;
}
