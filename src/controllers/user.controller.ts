import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getMyThresholds,
  updateMyThresholds,
  getMyPin,
  lookupUserByPin,
} from '../services/user.service';
import { UnauthorizedError } from '../utils/errors';
import { ValidationError } from '../utils/errors';

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const profile = await getUserProfile(req.userId);

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const { fullName } = req.body;
    const updatedUser = await updateUserProfile(req.userId, fullName);

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
}

export async function changeMyPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const { currentPassword, newPassword } = req.body;

    await changePassword(req.userId, currentPassword, newPassword);

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
}

export async function getThresholds(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const thresholds = await getMyThresholds(req.userId);

    res.status(200).json(thresholds);
  } catch (error) {
    next(error);
  }
}

export async function updateThresholds(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const { ars, usd, eur, btcUsd } = req.body;

    await updateMyThresholds(req.userId, ars, usd, eur, btcUsd);

    res.status(200).json({ message: 'Umbrales actualizados correctamente' });
  } catch (error) {
    next(error);
  }
}

export async function getPin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new UnauthorizedError('No autenticado');
    }

    const pin = await getMyPin(req.userId);

    res.status(200).json({ pin });
  } catch (error) {
    next(error);
  }
}

export async function lookupByPin(req: Request, res: Response, next: NextFunction) {
  try {
    const pin = req.query.pin as string;

    if (!pin) {
      throw new ValidationError('El PIN es requerido');
    }

    const result = await lookupUserByPin(pin);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
