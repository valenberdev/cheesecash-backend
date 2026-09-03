import { Router } from "express";
import { createTransferEndpoint, confirmTransferEndpoint, getFullHistory } from "../controllers/transfer.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", requireAuth, createTransferEndpoint);
router.get("/confirm/:token", confirmTransferEndpoint);
router.get("/history", requireAuth, getFullHistory);

export default router;