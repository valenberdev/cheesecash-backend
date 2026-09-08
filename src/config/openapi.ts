export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Cheese Cash API',
    version: '1.0.0',
    description: 'Billetera digital multi-moneda — backend del Proyecto Final Henry Fullstack.',
  },
  servers: [
    { url: 'https://cheesecash-back-production.up.railway.app/api', description: 'Producción' },
    { url: 'http://localhost:3000/api', description: 'Local' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Registrar un usuario nuevo',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'fullName', 'birthDate'],
                properties: {
                  email: { type: 'string', example: 'usuario@ejemplo.com' },
                  password: { type: 'string', example: 'password123' },
                  fullName: { type: 'string', example: 'Juan Pérez' },
                  birthDate: { type: 'string', format: 'date', example: '1995-05-20' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Usuario creado, con wallet y balances iniciales' },
          '400': { description: 'Datos inválidos (email duplicado, password corto, menor de 18)' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Iniciar sesión',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Devuelve { token, user }' },
          '401': { description: 'Credenciales inválidas' },
          '429': { description: 'Demasiados intentos' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Solicitar reseteo de contraseña',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['email'], properties: { email: { type: 'string' } } },
            },
          },
        },
        responses: { '200': { description: 'Mensaje genérico (llega mail si el email existe)' } },
      },
    },
    '/auth/reset-password': {
      post: {
        summary: 'Confirmar reseteo de contraseña con el token del mail',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: { token: { type: 'string' }, newPassword: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Contraseña actualizada' }, '401': { description: 'Token inválido o expirado' } },
      },
    },
    '/users/me': {
      get: {
        summary: 'Ver el perfil propio',
        tags: ['Usuario'],
        responses: { '200': { description: 'Perfil del usuario' }, '401': { description: 'No autenticado' } },
      },
      put: {
        summary: 'Editar el nombre completo',
        tags: ['Usuario'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { fullName: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Perfil actualizado' } },
      },
    },
    '/users/me/password': {
      put: {
        summary: 'Cambiar la contraseña (logueado)',
        tags: ['Usuario'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Contraseña actualizada' }, '401': { description: 'Contraseña actual incorrecta' } },
      },
    },
    '/users/me/thresholds': {
      get: {
        summary: 'Ver los umbrales de confirmación por monto alto',
        tags: ['Usuario'],
        responses: { '200': { description: '{ threshold_ars, threshold_usd, threshold_eur, threshold_btc_usd }' } },
      },
      put: {
        summary: 'Editar los umbrales de confirmación',
        tags: ['Usuario'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ars: { type: 'number' }, usd: { type: 'number' }, eur: { type: 'number' }, btcUsd: { type: 'number' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Umbrales actualizados' } },
      },
    },
    '/users/me/pin': {
      get: {
        summary: 'Ver (o generar) el PIN único propio',
        tags: ['Usuario'],
        responses: { '200': { description: '{ pin }' } },
      },
    },
    '/wallet/balances': {
      get: {
        summary: 'Ver el balance de las 4 monedas',
        tags: ['Wallet'],
        responses: { '200': { description: 'Array de balances' } },
      },
    },
    '/deposits': {
      post: {
        summary: 'Simular un depósito',
        tags: ['Depósitos'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currency', 'amount'],
                properties: {
                  currency: { type: 'string', enum: ['ARS', 'USD', 'EUR', 'BTC'] },
                  amount: { type: 'number' },
                  reference: { type: 'string', description: 'Opcional, para idempotencia' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Depósito acreditado' }, '400': { description: 'Monto inválido o supera el máximo' } },
      },
      get: {
        summary: 'Ver el historial de depósitos',
        tags: ['Depósitos'],
        responses: { '200': { description: 'Array de depósitos' } },
      },
    },
    '/transactions': {
      post: {
        summary: 'Comprar, vender o cambiar de moneda',
        tags: ['Transacciones'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'fromCurrency', 'toCurrency', 'fromAmount'],
                properties: {
                  type: { type: 'string', enum: ['buy', 'sell', 'exchange'] },
                  fromCurrency: { type: 'string', enum: ['ARS', 'USD', 'EUR', 'BTC'] },
                  toCurrency: { type: 'string', enum: ['ARS', 'USD', 'EUR', 'BTC'] },
                  fromAmount: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Transacción creada (status success o pending si supera el umbral)' },
          '400': { description: 'Saldo insuficiente o monto inválido' },
        },
      },
      get: {
        summary: 'Ver el historial de transacciones',
        tags: ['Transacciones'],
        responses: { '200': { description: 'Array de transacciones' } },
      },
    },
    '/transactions/confirm/{token}': {
      get: {
        summary: 'Confirmar una transacción de monto alto',
        tags: ['Transacciones'],
        security: [],
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Transacción confirmada' }, '401': { description: 'Token inválido o expirado' } },
      },
    },
    '/transfers': {
      post: {
        summary: 'Transferir a otro usuario (por email o PIN)',
        tags: ['Transferencias'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currency', 'amount'],
                properties: {
                  toEmail: { type: 'string' },
                  toPin: { type: 'string' },
                  currency: { type: 'string', enum: ['ARS', 'USD', 'EUR', 'BTC'] },
                  amount: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Transferencia creada (status success o pending)' },
          '400': { description: 'Datos inválidos o saldo insuficiente' },
        },
      },
    },
    '/transfers/confirm/{token}': {
      get: {
        summary: 'Confirmar una transferencia de monto alto',
        tags: ['Transferencias'],
        security: [],
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Transferencia confirmada' } },
      },
    },
    '/transfers/history': {
      get: {
        summary: 'Ver historial combinado (transacciones + transferencias)',
        tags: ['Transferencias'],
        responses: { '200': { description: 'Array combinado, ordenado por fecha' } },
      },
    },
    '/rates': {
      get: {
        summary: 'Ver cotizaciones',
        tags: ['Cotizaciones'],
        security: [],
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string' } },
          { name: 'to', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Con from/to: { from, to, rate }. Sin ellos: tabla completa' } },
      },
    },
    '/chatbot': {
      post: {
        summary: 'Hablar con el chatbot de soporte',
        tags: ['Chatbot'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['message'], properties: { message: { type: 'string' } } },
            },
          },
        },
        responses: { '200': { description: '{ reply }' } },
      },
    },
  },
};