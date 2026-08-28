import { Router } from "express";
import { createTransactionEndpoint } from "../controllers/transaction.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", requireAuth, createTransactionEndpoint);

export default router;
