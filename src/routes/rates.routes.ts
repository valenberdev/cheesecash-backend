import { Router } from "express";
import { getRates, getRatesHistory } from "../controllers/rates.controller";

const router = Router();

router.get("/", getRates);
router.get("/history", getRatesHistory);

export default router;