import { Router } from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../controllers/wishlistController.js";

const router = Router();
router.get("/", getWishlist);
router.patch("/add", addToWishlist);
router.patch("/remove", removeFromWishlist);
router.patch("/clear", clearWishlist);
export default router;
