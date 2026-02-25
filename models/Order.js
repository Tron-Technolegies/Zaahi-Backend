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

const OrderSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Product,
    },
    qty: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Pending", "Delivered", "Shipped", "Cancelled"],
      default: "Pending",
      required: true,
    },
    address: {
      type: [AddressSchema],
      required: true,
    },
  },
  { timestamps: true }
);

const Order = model("Order", OrderSchema);
export default Order;
