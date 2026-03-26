import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import { formatImage } from "../middlewares/multerMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { cleanupCloudinaryImages } from "../services/cloudinary.js";

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
  let uploadedPublicIds = [];
  try {
    const { productId, review, rating } = req.body;
    const { userId } = req.user;

    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestError("Rating must be between 1 and 5");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError("No product found");
    }

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("No user found");

    const uploadSingle = async (file) => {
      const formatted = formatImage(file);
      const res = await cloudinary.uploader.upload(formatted);
      uploadedPublicIds.push(res.public_id);
      return {
        url: res.secure_url,
        publicId: res.public_id,
      };
    };

    let reviewImage = null;

    if (req.files?.image?.[0]) {
      reviewImage = await uploadSingle(req.files.image[0]);
    }

    const newReview = new Review({
      user: req.user.userId,
      product: productId,
      rating,
      review,
      image: reviewImage,
    });

    await newReview.save();

    product.totalReviews = (product.totalReviews || 0) + 1;
    product.sumRating = (product.sumRating || 0) + Number(rating);
    product.rating = product.sumRating / product.totalReviews;

    await product.save();

    res.status(201).json({
      message: "Review added successfully",
      review: newReview,
    });
  } catch (error) {
    await cleanupCloudinaryImages(uploadedPublicIds);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getAllProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPage } = req.query;
    const page = Number(currentPage);
    const limit = 10;
    const skip = (page - 1) * limit;
    const reviews = await Review.find({ product: id })
      .populate("user", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Review.countDocuments({ product: id });
    const ratingStats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    // 👉 Convert to clean format
    const breakdown = {
      oneStar: 0,
      twoStar: 0,
      threeStar: 0,
      fourStar: 0,
      fiveStar: 0,
    };

    ratingStats.forEach((item) => {
      if (item._id === 1) breakdown.oneStar = item.count;
      if (item._id === 2) breakdown.twoStar = item.count;
      if (item._id === 3) breakdown.threeStar = item.count;
      if (item._id === 4) breakdown.fourStar = item.count;
      if (item._id === 5) breakdown.fiveStar = item.count;
    });
    res.status(200).json({
      reviews,
      hasMore: skip + reviews.length < total,
      breakdown,
      total,
    });
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
