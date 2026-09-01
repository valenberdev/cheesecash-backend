import { Router } from "express";
import { createTransactionEndpoint, getHistory, confirmTransactionEndpoint } from "../controllers/transaction.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", requireAuth, createTransactionEndpoint);
router.get("/", requireAuth, getHistory);
router.get("/confirm/:token", confirmTransactionEndpoint);

export default router;