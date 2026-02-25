import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// export const addAReview = async (req, res) => {
//   try {
//     const { productId, review, rating } = req.body;
//     const product = await Product.findById(productId);
//     if (!product) throw new NotFoundError("No product found");
//     const existingReview = await Review.findOne({
//       user: req.user.userId,
//       product: productId,
//     });
//     if (existingReview)
//       throw new BadRequestError("user already reviewed this product");
//     const user = await User.findById(req.user.userId)
//       .select("orders")
//       .populate("orders", "product");
//     const orders = user.orders;
//     const isPurchased = orders.find(
//       (item) => item.product.toString() === productId.toString(),
//     );
//     if (!isPurchased) throw new BadRequestError("Doesn't purchased this item");
//     const newReview = new Review({
//       user: req.user.userId,
//       product: productId,
//       rating: rating,
//       review: review,
//     });
//     product.totalReviews = (product.totalReviews || 0) + 1;
//     product.sumOfRating = (product.sumOfRating || 0) + rating;
//     product.rating = product.sumOfRating / product.totalReviews;
//     await product.save();
//     await newReview.save();
//     res.status(200).json({ message: "success", newReview });
//   } catch (error) {
//     res.status(error.statusCode || 500).json({ error: error.message });
//   }
// };

export const addAReview = async (req, res) => {
  try {
    const { productId, review, rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestError("Rating must be between 1 and 5");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError("No product found");
    }

    const existingReview = await Review.findOne({
      user: req.user.userId,
      product: productId,
    });

    if (existingReview) {
      throw new BadRequestError("User already reviewed this product");
    }

    const user = await User.findById(req.user.userId)
      .select("orders")
      .populate("orders", "product status");

    const isDelivered = user.orders.find(
      (order) =>
        order.product.toString() === productId.toString() &&
        order.status === "Delivered",
    );

    if (!isDelivered) {
      throw new BadRequestError(
        "You can review this product only after delivery",
      );
    }

    const newReview = await Review.create({
      user: req.user.userId,
      product: productId,
      rating,
      review,
    });

    product.totalReviews = (product.totalReviews || 0) + 1;
    product.sumOfRating = (product.sumOfRating || 0) + rating;
    product.rating = product.sumOfRating / product.totalReviews;

    await product.save();

    res.status(201).json({
      message: "Review added successfully",
      review: newReview,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
  console.log("DB NAME 👉", mongoose.connection.name);
};

export const getAllProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await Review.find({ product: id }).populate(
      "user",
      "username",
    );

    res.status(200).json(reviews);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getAllTestimonials = async (req, res) => {
  const reviews = await Review.find()
    .populate("user", "username")
    .sort({ createdAt: -1 })
    .limit(6);

  res.status(200).json(reviews);
};
