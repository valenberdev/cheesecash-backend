import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getUserProfile, updateUserProfile } from "../services/user.service";

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const profile = await getUserProfile(req.userId);

    res.status(200).json(profile);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
}

export async function updateMe(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const { fullName } = req.body;
    const updatedUser = await updateUserProfile(req.userId, fullName);

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
