import { Router } from "express";
import {
  addAddress,
  getAddresses,
  makeDefaultAddress,
  removeAddress,
  updateAddress,
} from "../controllers/addressController.js";
import { validateAddAddress } from "../middlewares/validationMiddleware.js";

const router = Router();
router.post("/add", validateAddAddress, addAddress);
router.patch("/update/:addressId", updateAddress);
router.patch("/remove/:addressId", removeAddress);
router.patch("/default/:addressId", makeDefaultAddress);
router.get("/", getAddresses);
export default router;
