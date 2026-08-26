import { Request, Response } from "express";
import { registerUser } from "../services/auth.service";

export async function register(req: Request, res: Response) {
  try {
    const { email, password, fullName } = req.body;

    const newUser = await registerUser(email, password, fullName);

    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
