import { Router } from "express";
import { createTransferEndpoint, confirmTransferEndpoint, getFullHistory } from "../controllers/transfer.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from '../middlewares/validate.middleware';
import { createTransferSchema } from '../schemas/transfer.schema';

const router = Router();

router.post("/", validate(createTransferSchema), requireAuth, createTransferEndpoint);
router.get("/confirm/:token", confirmTransferEndpoint);
router.get("/history", requireAuth, getFullHistory);

export default router;