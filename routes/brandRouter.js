import { Router } from "express";
import {
  authenticateUser,
  isAdmin,
} from "../middlewares/authenticationMiddleware.js";
import { validateAddBrand } from "../middlewares/validationMiddleware.js";
import {
  addNewBrand,
  deleteBrand,
  editBrand,
  getAllBrands,
  getSingleBrand,
} from "../controllers/brandController.js";

const router = Router();
router.post("/", authenticateUser, isAdmin, validateAddBrand, addNewBrand);
router.get("/", getAllBrands);
router.get("/:id", authenticateUser, isAdmin, getSingleBrand);
router.patch(
  "/edit/:id",
  authenticateUser,
  isAdmin,
  validateAddBrand,
  editBrand
);
router.delete("/delete/:id", authenticateUser, isAdmin, deleteBrand);
export default router;
