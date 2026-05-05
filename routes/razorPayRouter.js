import { Router } from "express";
import {
  createRazorPayOrder,
  paymentCancelled,
  paymentFailed,
  verifyRazorPayPayment,
} from "../controllers/razorPayController.js";
import { validateCreatePayment } from "../middlewares/validationMiddleware.js";

const router = Router();

router.post("/create-order", validateCreatePayment, createRazorPayOrder);
router.post("/verify-payment", verifyRazorPayPayment);
router.post("/cancel-payment", paymentCancelled);
router.post("/failed-payment", paymentFailed);

export default router;
