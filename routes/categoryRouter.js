import { Router } from "express";
import {
  authenticateUser,
  isAdmin,
} from "../middlewares/authenticationMiddleware.js";
import {
  validateAddBrand,
  validateAddCategory,
} from "../middlewares/validationMiddleware.js";
import {
  addNewCategory,
  deleteCategory,
  editCategory,
  getAllCategories,
  getSingleCategory,
} from "../controllers/categoryController.js";

const router = Router();
router.post(
  "/",
  authenticateUser,
  isAdmin,
  validateAddCategory,
  addNewCategory
);
router.get("/", getAllCategories);
router.get("/:id", authenticateUser, isAdmin, getSingleCategory);
router.patch(
  "/edit/:id",
  authenticateUser,
  isAdmin,
  validateAddCategory,
  editCategory
);
router.delete("/delete/:id", authenticateUser, isAdmin, deleteCategory);

export default router;
