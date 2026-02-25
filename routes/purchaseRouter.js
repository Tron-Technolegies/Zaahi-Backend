import { Router } from "express";
import { purchaseProduct } from "../controllers/purchaseController.js";
import { validatePurchaseAddress } from "../middlewares/validationMiddleware.js";

const router = Router();
router.patch("/", validatePurchaseAddress, purchaseProduct);

export default router;
