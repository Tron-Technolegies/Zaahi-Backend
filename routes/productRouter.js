import { Router } from "express";
import {
  addProduct,
  deleteImage,
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
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "extraImages", maxCount: 10 },
  ]),
  validateAddProduct,
  addProduct,
);
router.get("/", getAllProducts);
router.get("/:id", getSingleProduct);
router.patch(
  "/edit/:id",
  authenticateUser,
  isAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "extraImages", maxCount: 10 },
  ]),
  validateAddProduct,
  editProduct,
);
router.patch("/delete-image", authenticateUser, isAdmin, deleteImage);
router.delete("/delete/:id", authenticateUser, isAdmin, deleteProduct);
export default router;
