import { Router } from "express";
import {
  validateAddCart,
  validateRemoveFromCart,
  validateUpdateCart,
} from "../middlewares/validationMiddleware.js";
import {
  addToCart,
  clearCart,
  getAllCartItems,
  removeFromCart,
  updateCart,
} from "../controllers/cartController.js";

const router = Router();

router.patch("/add", validateAddCart, addToCart);
router.get("/", getAllCartItems);
router.patch("/update", validateUpdateCart, updateCart);
router.patch("/remove", validateRemoveFromCart, removeFromCart);
router.patch("/clear", clearCart);

export default router;
