import { Router } from "express";
import { getAllUsers, getUserInfo } from "../controllers/userController.js";

const router = Router();
router.get("/info", getUserInfo);
router.get("/", getAllUsers);
export default router;
