import { Router } from "express";
import { getMe } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", requireAuth, getMe);

export default router;
