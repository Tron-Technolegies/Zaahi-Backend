import { Router } from "express";
import {
  loginUser,
  logout,
  registerUser,
} from "../controllers/authController.js";
import { authenticateUser } from "../middlewares/authenticationMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);

export default router;
