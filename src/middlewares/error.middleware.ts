import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  logger.error('Error no controlado:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
}