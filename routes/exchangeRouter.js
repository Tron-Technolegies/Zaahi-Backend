import { Router } from "express";
import { getExchangeRate } from "../controllers/exchangeController.js";

const router = Router();

router.get("/", getExchangeRate);

export default router;
