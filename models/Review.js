import mongoose, { model, Schema } from "mongoose";
import User from "./User.js";
import Product from "./Product.js";

const ReviewSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    review: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
  },
  { timestamps: true },
);

const Review = model("Review", ReviewSchema);
export default Review;
