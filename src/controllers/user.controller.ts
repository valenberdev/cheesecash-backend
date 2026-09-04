import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getMyThresholds,
  updateMyThresholds,
} from "../services/user.service";

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

export async function changeMyPassword(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    await changePassword(req.userId, currentPassword, newPassword);

    res.status(200).json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

export async function getThresholds(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const thresholds = await getMyThresholds(req.userId);

    res.status(200).json(thresholds);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
}

export async function updateThresholds(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const { ars, usd, eur, btcUsd } = req.body;

    await updateMyThresholds(req.userId, ars, usd, eur, btcUsd);

    res.status(200).json({ message: "Umbrales actualizados correctamente" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
