import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  findUserByEmail,
  createUser,
  findUserByEmailWithPassword,
} from "../repositories/user.repository";
import { createInitialBalances } from "../repositories/balance.repository";
import { createWallet } from "../repositories/wallet.repository";

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
