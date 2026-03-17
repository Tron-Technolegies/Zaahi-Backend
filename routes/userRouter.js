import { Router } from "express";
import {
  getAllUsers,
  getUserInfo,
  updateUserProfile,
} from "../controllers/userController.js";
import { validateUpdateUserProfile } from "../middlewares/validationMiddleware.js";

const router = Router();
router.get("/info", getUserInfo);
router.get("/", getAllUsers);
router.patch("/profile", validateUpdateUserProfile, updateUserProfile);
export default router;
