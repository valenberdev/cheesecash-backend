import { Router } from "express";
import { createTransactionEndpoint, getHistory, confirmTransactionEndpoint } from "../controllers/transaction.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from '../middlewares/validate.middleware';
import { createTransactionSchema } from '../schemas/transaction.schema';

const router = Router();

router.post("/", validate(createTransactionSchema), requireAuth, createTransactionEndpoint);
router.get("/", requireAuth, getHistory);
router.get("/confirm/:token", confirmTransactionEndpoint);

export default router;