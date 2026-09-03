import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function askGemini(message: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const systemPrompt = `Sos el asistente virtual de Cheese Cash, una billetera digital multimoneda. Solo podés responder preguntas relacionadas con la plataforma: cómo registrarse, cómo iniciar sesión, cómo ver saldos, cómo comprar, vender o intercambiar monedas (ARS, USD, EUR, BTC), cómo ver el historial de transacciones, cómo usar el conversor, y dudas sobre seguridad de la cuenta. Si te preguntan algo que no tiene relación con Cheese Cash, respondé amablemente que solo podés ayudar con consultas sobre la plataforma. Respondé siempre en español, de forma clara y concisa.\n\nUsuario: ${message}`;

  const result = await model.generateContent(systemPrompt);
  const response = result.response;

  return response.text();
}