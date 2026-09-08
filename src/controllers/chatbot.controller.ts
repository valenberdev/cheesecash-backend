import { Request, Response, NextFunction } from 'express';
import { askGemini } from '../services/gemini.service';
import { ValidationError } from '../utils/errors';

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new ValidationError('El mensaje no puede estar vacío');
    }

    const reply = await askGemini(message);

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error en chatbot:', error);
    next(error);
  }
}