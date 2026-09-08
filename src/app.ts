import express from "express";
import cors from "cors";
import routes from "./routes";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error.middleware";
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './config/openapi';

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL as string,
  'http://localhost:5173',
];

app.set("trust proxy", 1);
app.use(cors({
  origin: allowedOrigins,
}));
app.use(helmet());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);
app.use(errorHandler);

export default app;
