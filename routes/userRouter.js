import { Router } from "express";
import {
  getAllUsers,
  getUserInfo,
  updatePassword,
  updateUserProfile,
} from "../controllers/userController.js";
import {
  validateUpdatePassword,
  validateUpdateUserProfile,
} from "../middlewares/validationMiddleware.js";

const router = Router();
router.get("/info", getUserInfo);
router.get("/", getAllUsers);
router.patch("/profile", validateUpdateUserProfile, updateUserProfile);
router.patch("/update-password", validateUpdatePassword, updatePassword);
export default router;
