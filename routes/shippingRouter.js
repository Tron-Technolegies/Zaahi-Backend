import { Router } from "express";
import {
  authenticateUser,
  isAdmin,
} from "../middlewares/authenticationMiddleware.js";
import {
  createNewShippingRates,
  getShippingRate,
} from "../controllers/shippingController.js";

const router = Router();

router.post("/", authenticateUser, isAdmin, createNewShippingRates);
router.get("/", getShippingRate);

export default router;
