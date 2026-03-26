import mongoose, { model, Schema } from "mongoose";

const ImageSchema = new Schema(
  {
    url: {
      type: String,
    },
    publicId: {
      type: String,
    },
  },
  { _id: false },
);

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
      type: ImageSchema,
    },
  },
  { timestamps: true },
);

const Review = model("Review", ReviewSchema);
export default Review;
