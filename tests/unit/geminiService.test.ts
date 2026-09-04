import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGenerateContent } = vi.hoisted(() => {
  return { mockGenerateContent: vi.fn() };
});

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: mockGenerateContent,
        };
      }
    },
  };
});

import { askGemini } from '../../src/services/gemini.service';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('askGemini', () => {
  it('devuelve el texto de la respuesta de Gemini', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => 'Hola, soy el asistente de CheeseCash' },
    });

    const reply = await askGemini('hola');

    expect(reply).toBe('Hola, soy el asistente de CheeseCash');
  });

  it('propaga el error si Gemini falla', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API no disponible'));

    await expect(askGemini('hola')).rejects.toThrow('API no disponible');
  });
});