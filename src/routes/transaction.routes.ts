import { Router } from "express";
import { createTransactionEndpoint, getHistory } from "../controllers/transaction.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", requireAuth, createTransactionEndpoint);
router.get("/", requireAuth, getHistory);

export default router;
