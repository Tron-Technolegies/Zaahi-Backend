import { Router } from "express";
import {
  addAReview,
  getAllProductReview,
  getAllTestimonials,
  getRandomReviews,
} from "../controllers/reviewController.js";
import upload from "../middlewares/multerMiddleware.js";
import { validateAddReview } from "../middlewares/validationMiddleware.js";
import { authenticateUser } from "../middlewares/authenticationMiddleware.js";

const router = Router();

router.post(
  "/add",
  authenticateUser,
  upload.fields([{ name: "image", maxCount: 1 }]),
  validateAddReview,
  addAReview,
);

router.get("/", getAllTestimonials);
router.get("/random", getRandomReviews);
router.get("/:id", getAllProductReview);

export default router;
