import { model, Schema } from "mongoose";
import Category from "./Category.js";
import Brand from "./Brand.js";

const ProductSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },

    stock: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
    },

    size: {
      type: [String],
    },
    specification: {
      type: Map,
    },
    rating: {
      type: Number,
    },
    totalReviews: {
      type: Number,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Product = model("Product", ProductSchema);
export default Product;
