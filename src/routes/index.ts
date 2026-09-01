import { Router } from "express";
import authRoutes from "./auth.routes";
import walletRoutes from "./wallet.routes";
import userRoutes from "./user.routes";
import transactionRoutes from "./transaction.routes";
import chatbotRoutes from "./chatbot.routes";
import ratesRoutes from "./rates.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/users", userRoutes);
router.use("/transactions", transactionRoutes);
router.use("/rates", ratesRoutes);

export default router;
