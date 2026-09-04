import { Router } from "express";
import {
  getMe,
  updateMe,
  changeMyPassword,
} from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { changePasswordSchema } from "../schemas/auth.schema";

const router = Router();

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.put("/me/password", validate(changePasswordSchema), requireAuth, changeMyPassword);

export default router;
