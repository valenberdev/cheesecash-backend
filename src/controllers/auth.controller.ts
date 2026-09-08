import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, loginWithGoogle, requestPasswordReset, confirmPasswordReset } from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, fullName, birthDate } = req.body;

    const birthDateObj = new Date(birthDate);

    const newUser = await registerUser(email, password, fullName, birthDateObj);

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken } = req.body;

    const result = await loginWithGoogle(idToken);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    await requestPasswordReset(email);

    res.status(200).json({ message: 'Si el email existe, te llegó un mail con instrucciones' });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;

    await confirmPasswordReset(token, newPassword);

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
}