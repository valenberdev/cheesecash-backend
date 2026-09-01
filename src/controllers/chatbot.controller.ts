import { Request, Response } from 'express';
import { askGemini } from '../services/gemini.service';

export async function sendMessage(req: Request, res: Response) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'El mensaje no puede estar vacío' });
      return;
    }

    const reply = await askGemini(message);

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo procesar tu mensaje en este momento' });
  }
}