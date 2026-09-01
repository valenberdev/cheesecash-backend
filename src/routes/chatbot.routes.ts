import { Router } from "express";
import { sendMessage } from "../controllers/chatbot.controller";
import { chatbotRateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post("/", chatbotRateLimit, sendMessage);

export default router;
