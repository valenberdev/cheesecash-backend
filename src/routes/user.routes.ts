import { Router } from "express";
import {
  getMe,
  updateMe,
  changeMyPassword,
  getThresholds,
  updateThresholds,
  getPin,
  lookupByPin,
} from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { changePasswordSchema } from "../schemas/auth.schema";
import { lookupRateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.get("/me/pin", requireAuth, getPin);
router.get('/lookup', requireAuth, lookupRateLimit, lookupByPin);
router.put("/me/password", validate(changePasswordSchema), requireAuth, changeMyPassword);
router.get("/me/thresholds", requireAuth, getThresholds);
router.put("/me/thresholds", requireAuth, updateThresholds);

export default router;