import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
): Promise<void> {
  const command = new SendEmailCommand({
    Source: process.env.SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: htmlBody },
      },
    },
  });

  await sesClient.send(command);
}

export async function sendTransactionReceiptEmail(
  to: string,
  transaction: {
    type: string;
    from_currency: string;
    to_currency: string;
    from_amount: string;
    to_amount: string;
    exchange_rate_used: string;
    created_at: Date;
  }
): Promise<void> {
  const subject = `Comprobante de operación - CheeseCash`;

  const formatAmount = (amount: string, currency: string) => {
    const decimals = currency === 'BTC' ? 6 : 2;
    return `${parseFloat(amount).toFixed(decimals)} ${currency}`;
  };

  const formattedDate = new Date(transaction.created_at).toLocaleString('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const html = `
    <h2>Tu operación fue exitosa</h2>
    <p><strong>Tipo:</strong> ${transaction.type}</p>
    <p><strong>Enviaste:</strong> ${formatAmount(transaction.from_amount, transaction.from_currency)}</p>
    <p><strong>Recibiste:</strong> ${formatAmount(transaction.to_amount, transaction.to_currency)}</p>
    <p><strong>Tasa utilizada:</strong> ${parseFloat(transaction.exchange_rate_used).toFixed(6)}</p>
    <p><strong>Fecha:</strong> ${formattedDate}</p>
  `;

  await sendEmail(to, subject, html);
}
