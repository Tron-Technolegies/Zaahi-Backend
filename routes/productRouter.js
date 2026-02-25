import { Router } from "express";
import {
  addProduct,
  deleteProduct,
  editProduct,
  getAllProducts,
  getSingleProduct,
} from "../controllers/productController.js";
import upload from "../middlewares/multerMiddleware.js";
import {
  authenticateUser,
  isAdmin,
} from "../middlewares/authenticationMiddleware.js";
import { validateAddProduct } from "../middlewares/validationMiddleware.js";

const router = Router();
router.post(
  "/",
  authenticateUser,
  isAdmin,
  upload.single("image"),
  validateAddProduct,
  addProduct
);
router.get("/", getAllProducts);
router.get("/:id", getSingleProduct);
router.patch(
  "/edit/:id",
  authenticateUser,
  isAdmin,
  upload.single("image"),
  editProduct
);
router.delete("/delete/:id", authenticateUser, isAdmin, deleteProduct);
export default router;
