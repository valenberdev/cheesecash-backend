import { Router } from "express";
import {
  createDepositEndpoint,
  getDepositsEndpoint,
} from "../controllers/deposit.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createDepositSchema } from "../schemas/deposit.schema";

const router = Router();

router.post("/", validate(createDepositSchema), requireAuth, createDepositEndpoint);
router.get("/", requireAuth, getDepositsEndpoint);

export default router;
