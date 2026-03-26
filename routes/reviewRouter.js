import { Router } from "express";
import {
  addAReview,
  getAllProductReview,
  getAllTestimonials,
} from "../controllers/reviewController.js";
import upload from "../middlewares/multerMiddleware.js";
import { validateAddReview } from "../middlewares/validationMiddleware.js";

const router = Router();

router.post(
  "/add",
  upload.fields([{ name: "image", maxCount: 1 }]),
  validateAddReview,
  addAReview,
);

router.get("/", getAllTestimonials);
router.get("/:id", getAllProductReview);

export default router;
