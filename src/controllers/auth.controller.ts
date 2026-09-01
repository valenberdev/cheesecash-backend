import { Request, Response } from "express";
import { registerUser, loginUser, loginWithGoogle, requestPasswordReset, confirmPasswordReset } from "../services/auth.service";

export async function register(req: Request, res: Response) {
  try {
    const { email, password, fullName } = req.body;

    const newUser = await registerUser(email, password, fullName);

    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const { idToken } = req.body;

    const result = await loginWithGoogle(idToken);

    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    await requestPasswordReset(email);

    res.status(200).json({ message: 'Si el email existe, te llegó un mail con instrucciones' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function resetPasswordEndpoint(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    await confirmPasswordReset(token, newPassword);

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}