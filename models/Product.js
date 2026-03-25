import { model, Schema } from "mongoose";
import Category from "./Category.js";
import Brand from "./Brand.js";

const SpecsSchema = new Schema({
  spec: String,
  value: String,
});
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

const VariantSchema = new Schema({
  size: {
    type: String,
    required: true,
  },
  color: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  sku: {
    type: String,
  },
});

const ProductSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
    },
    status: {
      type: String,
    },
    image: ImageSchema,
    description: String,
    variants: {
      type: [VariantSchema],
    },
    specification: [SpecsSchema],
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
    extraImages: [ImageSchema],
  },
  { timestamps: true },
);

const Product = model("Product", ProductSchema);
export default Product;
