import { Router } from "express";
import {
  addAReview,
  getAllProductReview,
  getAllTestimonials,
} from "../controllers/reviewController.js";

const router = Router();

router.post("/add", addAReview);

router.get("/", getAllTestimonials);
router.get("/:id", getAllProductReview);

export default router;
