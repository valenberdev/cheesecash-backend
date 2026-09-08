# Cheese Cash — Backend

Backend de **Cheese Cash**, una billetera digital multi-moneda (ARS, USD, EUR, BTC) desarrollada como Proyecto Final de la carrera Fullstack Developer en Henry.

Permite registro y autenticación de usuarios, gestión de wallets y balances, depósitos simulados, operaciones de compra/venta/cambio de moneda con cotizaciones reales, transferencias entre usuarios (por email o PIN), confirmación por email para montos altos, notificaciones en tiempo real y un chatbot de soporte.

**API en producción:** `https://cheesecash-back-production.up.railway.app`

---

## Stack

- **Runtime / Framework:** Node.js + Express + TypeScript (modo `strict`)
- **Base de datos:** PostgreSQL, con migraciones versionadas (`node-pg-migrate`)
- **Autenticación:** JWT + bcrypt
- **Validación:** Zod
- **Manejo de errores:** clases tipadas + middleware centralizado (ver [Decisiones técnicas](#decisiones-técnicas))
- **Tiempo real:** Socket.io
- **Emails:** AWS SES
- **Chatbot:** Gemini API (proxy propio, la key nunca se expone al cliente)
- **Cotizaciones:** DolarApi.com (dólar oficial ARS↔USD), ExchangeRate-API (EUR y demás fiat), CoinGecko (BTC)
- **Seguridad:** Helmet, CORS restringido, rate limiting (`express-rate-limit`)
- **Tests:** Vitest
- **Deploy:** Railway (con Postgres administrado)

---

## Arquitectura

Separación en capas, sin filtraciones entre ellas:

```
routes  →  controllers  →  services  →  repositories  →  PostgreSQL
```

- **`routes/`** — define los endpoints y aplica middlewares (`requireAuth`, `validate`, rate limits).
- **`controllers/`** — recibe la request, delega en el service correspondiente, y pasa cualquier error a `next(error)`. No decide códigos HTTP.
- **`services/`** — toda la lógica de negocio: reglas, cálculos, transacciones SQL (`BEGIN`/`COMMIT`/`ROLLBACK`). Es quien decide, tirando la clase de error correcta, qué código HTTP le corresponde a cada fallo.
- **`repositories/`** — único lugar del código que ejecuta SQL directo contra Postgres.
- **`middlewares/`** — autenticación (JWT), validación (Zod), rate limiting, manejo de errores centralizado.
- **`utils/errors.ts`** — clases de error tipadas (`NotFoundError`, `ValidationError`, `UnauthorizedError`), cada una asociada a su código HTTP.
- **`config/`** — conexión a la base y configuración de Socket.io.
- **`db/` / `migrations/`** — migraciones versionadas.

---

## Setup local

### Requisitos

- Node.js 18+
- PostgreSQL (local o vía Docker)
- Cuentas/keys de: AWS SES, Gemini API, ExchangeRate-API (CoinGecko y DolarApi.com no requieren key)

### Instalación

```bash
git clone https://github.com/valenberdev/cheesecash-backend.git
cd cheesecash-backend
npm install
cp .env.example .env
```

Completá `.env` con tus propios valores (ver [Variables de entorno](#variables-de-entorno)).

### Migraciones

```bash
npx node-pg-migrate up
```

### Correr en desarrollo

```bash
npm run dev
```

Server en `http://localhost:3000`. Confirmá con `GET /health` → `{"status":"ok"}`.

### Build y producción

```bash
npm run build
npm start
```

`npm start` corre las migraciones pendientes automáticamente antes de levantar el server — no requiere ningún paso manual en el deploy.

### Tests

```bash
npm test
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del server (default 3000) |
| `NODE_ENV` | `development` o `production` (afecta SSL de Postgres) |
| `DATABASE_URL` | Connection string de Postgres |
| `JWT_SECRET` | Secreto para firmar los JWT |
| `JWT_EXPIRES_IN` | Duración del token (ej. `1d`) |
| `EXCHANGE_RATE_API_KEY` | Key de ExchangeRate-API (fiat EUR y demás) |
| `COINGECKO_API_URL` | URL base de CoinGecko (no requiere key) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | Credenciales de AWS SES |
| `SES_FROM_EMAIL` | Email remitente verificado en SES |
| `GEMINI_API_KEY` | Key de Gemini para el chatbot |
| `FRONTEND_URL` | Origen permitido en CORS y usado en links de mails |

---

## Modelo de datos

- **`users`** — email, password_hash, full_name, birth_date, user_pin (único, 6 dígitos), reset_token/reset_token_expires, threshold_ars/usd/eur/btc_usd (umbral de confirmación por moneda, configurable por usuario).
- **`wallets`** — pertenece a un usuario (preparada para soportar más de una wallet o wallets compartidas a futuro).
- **`balances`** — balance por wallet y moneda (`ARS`/`USD`/`EUR`/`BTC`), `numeric(18,8)` (nunca `float`), único por `(wallet_id, currency)`.
- **`deposits`** — carga de saldo simulada, con `reference` única para idempotencia (evita duplicar un depósito si se reintenta).
- **`transactions`** — operaciones de compra/venta/cambio dentro de una misma wallet. `status`: `pending`/`success`/`failed`. `confirmation_token`/`expires_at` para el flujo de monto alto.
- **`transfers`** — movimientos entre dos wallets distintas. Misma lógica de `status` y confirmación que `transactions`. `CHECK` que impide transferirse a uno mismo.

Reglas garantizadas por la base, no solo por la aplicación: `CHECK` en monedas/montos/estados, `UNIQUE` en balances y en `deposits.reference`, `ON DELETE CASCADE` en wallets, `ON DELETE RESTRICT` en transacciones y transferencias (nunca se pierde historial).

---

## Endpoints

Base: `/api`. Los que requieren token esperan `Authorization: Bearer <jwt>`.

### Auth (`/auth`)

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| POST | `/register` | No | `email, password, fullName, birthDate` | 201: usuario creado (wallet + 4 balances iniciales) |
| POST | `/login` | No | `email, password` | 200: `{ token, user }` |
| POST | `/forgot-password` | No | `email` | 200: mensaje genérico (llega mail si el email existe) |
| POST | `/reset-password` | No | `token, newPassword` | 200: mensaje de éxito |

Rate limit: 5 intentos / 15 min por IP en las 4 rutas.

### Usuario (`/users`)

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| GET | `/me` | Sí | — | 200: perfil |
| PUT | `/me` | Sí | `fullName` | 200: perfil actualizado |
| PUT | `/me/password` | Sí | `currentPassword, newPassword` | 200: mensaje |
| GET | `/me/thresholds` | Sí | — | 200: `{ threshold_ars, threshold_usd, threshold_eur, threshold_btc_usd }` |
| PUT | `/me/thresholds` | Sí | `ars, usd, eur, btcUsd` | 200: mensaje |
| GET | `/me/pin` | Sí | — | 200: `{ pin }` (se genera solo, la primera vez) |

### Wallet (`/wallet`)

| Método | Ruta | Auth | Respuesta |
|---|---|---|---|
| GET | `/balances` | Sí | 200: balance de las 4 monedas |

### Depósitos (`/deposits`)

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| POST | `/` | Sí | `currency, amount, reference` (opcional) | 201: depósito acreditado |
| GET | `/` | Sí | — | 200: historial de depósitos de la wallet |

Es una carga de saldo simulada para poder demostrar la app (no hay pasarela de pago real). Tiene un tope por operación según la moneda, e idempotencia por `reference`: reenviar la misma referencia devuelve el depósito original en vez de acreditar dos veces.

### Transacciones (`/transactions`)

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| POST | `/` | Sí | `type (buy/sell/exchange), fromCurrency, toCurrency, fromAmount` | 201: transacción (`status: success` o `pending`) |
| GET | `/` | Sí | — | 200: historial de la wallet |
| GET | `/confirm/:token` | No | — | 200: transacción confirmada |

`type` es una etiqueta de contexto — `buy`, `sell` y `exchange` ejecutan la misma lógica de movimiento de valor.

### Transferencias (`/transfers`)

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| POST | `/` | Sí | `toEmail` **o** `toPin`, `currency, amount` | 201: transferencia (`status: success` o `pending`) |
| GET | `/confirm/:token` | No | — | 200: transferencia confirmada |
| GET | `/history` | Sí | — | 200: historial combinado (transacciones + transferencias, ordenado por fecha, cada item con `kind`) |

### Cotizaciones (`/rates`)

| Método | Ruta | Auth | Query | Respuesta |
|---|---|---|---|---|
| GET | `/` | No | `from, to` (opcional) | Con `from`/`to`: `{ from, to, rate }`. Sin ellos: tabla completa contra USD |

ARS↔USD (directo o vía BTC) usa siempre el dólar oficial real (DolarApi.com); EUR usa ExchangeRate-API; BTC usa CoinGecko.

### Chatbot (`/chatbot`)

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| POST | `/` | No | `message` | 200: `{ reply }` |

Rate limit: 10 mensajes / minuto por IP.

### Health

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/health` | `{ status: "ok" }` |

---

## Decisiones técnicas

- **Manejo de errores unificado**: los services tiran clases específicas (`NotFoundError` → 404, `ValidationError` → 400, `UnauthorizedError` → 401) en vez de `Error` genérico. Los controllers nunca deciden un código HTTP — solo capturan y hacen `next(error)`. Un único middleware al final de la cadena (`error.middleware.ts`) responde según la clase del error, o con `500` si es un error no anticipado (y lo loguea para revisar en los logs de Railway).
- **`buy`/`sell`/`exchange` comparten lógica**: mover valor entre dos monedas dentro de una wallet es la misma operación técnica sin importar el nombre; distinguirlos solo aporta contexto para el frontend.
- **Confirmación por email para montos altos**: cada usuario define su propio umbral por moneda (`threshold_ars`, etc.). Al superarlo, la operación queda `pending`, se manda un mail con link de confirmación, y expira a las 2 horas sin tocar ningún balance.
- **PIN único por usuario**: alternativa al email para identificar al destinatario de una transferencia — más simple de compartir que pedir el email de alguien.
- **`SELECT ... FOR UPDATE`**: al mover balances, se bloquea la fila durante la transacción SQL para evitar condiciones de carrera (doble gasto) si dos operaciones tocan el mismo balance casi al mismo tiempo.
- **Montos como `numeric(18,8)`, nunca `float`**: para no perder precisión con las 8 decimales que necesita BTC.
- **Conversión ARS↔BTC consistente**: internamente se resuelve llamando de forma recursiva al mismo `getExchangeRate` para la pata ARS/USD, así siempre usa la misma fuente (DolarApi) que una conversión ARS↔USD directa.
- **Depósitos simulados con idempotencia**: no hay integración con una pasarela de pago real (fuera del alcance del proyecto); la `reference` única evita que un reintento duplique el saldo acreditado.
- **Google Sign-In, descartado**: se había implementado (`verifyIdToken` + chequeo de `email_verified`), pero el equipo decidió no incluirlo en el producto final. La ruta está desconectada; el código permanece en el repo como referencia.

## Limitaciones conocidas

- No hay transferencias con conversión de moneda incluida — el emisor y el receptor operan siempre en la misma moneda.
- Los depósitos son simulados, sin verificación real de origen de fondos.
