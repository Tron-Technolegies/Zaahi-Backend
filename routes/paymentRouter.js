import express from "express";
import { createPaymentIntent } from "../controllers/paymentController.js";
import { validateCreatePayment } from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.post("/payment-intent", validateCreatePayment, createPaymentIntent);

export default router;
