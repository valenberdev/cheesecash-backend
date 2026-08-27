import { Router } from "express";
import {
  getMe,
  updateMe,
  changeMyPassword,
} from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.put("/me/password", requireAuth, changeMyPassword);

export default router;
