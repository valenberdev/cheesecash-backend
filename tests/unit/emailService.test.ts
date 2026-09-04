import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSend } = vi.hoisted(() => {
  return { mockSend: vi.fn() };
});

vi.mock('@aws-sdk/client-ses', () => {
  return {
    SESClient: class {
      send = mockSend;
    },
    SendEmailCommand: class {
      constructor(params: any) {
        Object.assign(this, params);
      }
    },
  };
});

import { sendEmail, sendTransactionReceiptEmail } from '../../src/services/email.service';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendEmail', () => {
  it('llama a SES con el destinatario, asunto y cuerpo correctos', async () => {
    mockSend.mockResolvedValueOnce({});

    await sendEmail('test@test.com', 'Asunto de prueba', '<p>Cuerpo</p>');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        Destination: { ToAddresses: ['test@test.com'] },
        Message: expect.objectContaining({
          Subject: { Data: 'Asunto de prueba' },
        }),
      })
    );
  });

  it('propaga el error si SES falla', async () => {
    mockSend.mockRejectedValueOnce(new Error('SES no disponible'));

    await expect(sendEmail('test@test.com', 'Asunto', 'Cuerpo')).rejects.toThrow('SES no disponible');
  });
});

describe('sendTransactionReceiptEmail', () => {
  it('formatea el comprobante con 2 decimales para monedas fiat', async () => {
    mockSend.mockResolvedValueOnce({});

    const fakeTransaction = {
      type: 'exchange',
      from_currency: 'ARS',
      to_currency: 'USD',
      from_amount: '1000.00000000',
      to_amount: '0.66104785',
      exchange_rate_used: '0.00066105',
      created_at: new Date('2026-01-01T10:00:00'),
    };

    await sendTransactionReceiptEmail('test@test.com', fakeTransaction);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.Message.Body.Html.Data).toContain('1000.00 ARS');
    expect(callArgs.Message.Body.Html.Data).toContain('0.66 USD');
  });
});