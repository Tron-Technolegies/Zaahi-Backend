import { Router } from "express";
import { getAllUsers, getUserInfo } from "../controllers/userController.js";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../controllers/wishlistController.js";

const router = Router();
router.get("/", getWishlist);
router.patch("/add", addToWishlist);
router.patch("/remove", removeFromWishlist);
export default router;
