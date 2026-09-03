import express from "express";
import cors from "cors";
import routes from "./routes";
import helmet from "helmet";

const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);
app.use(helmet());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);

export default app;
