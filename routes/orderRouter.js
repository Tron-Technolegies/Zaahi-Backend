import { Router } from "express";
import {
  authenticateUser,
  isAdmin,
} from "../middlewares/authenticationMiddleware.js";
import {
  cancelOrder,
  confirmOrder,
  getAllOrders,
  getAllUserOrders,
  getSingleOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = Router();
router.post("/confirm", authenticateUser, confirmOrder);
router.get("/all", authenticateUser, isAdmin, getAllOrders);
router.get("/my-orders", authenticateUser, getAllUserOrders);
router.get("/:id", authenticateUser, getSingleOrder);
router.patch("/:orderId/status", authenticateUser, isAdmin, updateOrderStatus);
router.patch("/:orderId/cancel", authenticateUser, cancelOrder);

export default router;
