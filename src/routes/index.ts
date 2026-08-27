import { Router } from "express";
import authRoutes from "./auth.routes";
import walletRoutes from "./wallet.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);
router.use("/users", userRoutes);

export default router;
