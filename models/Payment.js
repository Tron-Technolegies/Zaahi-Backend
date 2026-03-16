import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Types.ObjectId,
      ref: "Order",
    },

    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },

    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },

    amount: Number,

    currency: String,

    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: String,
  },
  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
