import mongoose, { model, Schema } from "mongoose";
import User from "./User.js";
import Product from "./Product.js";

const AddressSchema = new Schema({
  name: {
    type: String,
  },
  street: {
    type: String,
  },
  state: {
    type: String,
  },
  pin: {
    type: String,
  },
  country: {
    type: String,
  },
  phone: {
    type: String,
  },
});

const orderItemsSchema = new Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },

  productName: String, // snapshot (important)
  image: String, // snapshot

  variant: {
    size: String,
    // future ready 👇
    color: String,
    sku: String,
  },

  qty: {
    type: Number,
    required: true,
  },

  price: {
    type: Number,
    required: true, // price at time of purchase
  },
});

const OrderSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    orderItems: {
      type: [orderItemsSchema],
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "aed",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentIntentId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Pending", "Delivered", "Shipped", "Cancelled"],
      default: "Pending",
      required: true,
    },
    address: {
      type: AddressSchema,
      required: true,
    },
  },
  { timestamps: true },
);

const Order = model("Order", OrderSchema);
export default Order;
