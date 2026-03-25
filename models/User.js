import mongoose, { model, Schema } from "mongoose";
import { type } from "os";

const AddressSchema = new Schema({
  name: {
    type: String,
  },
  isDefault: {
    type: Boolean,
    default: false,
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

const cartSchema = new Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  variant: {
    size: {
      type: String,
      required: true,
    },
    // future ready 👇
    color: String,
  },
  qty: {
    type: Number,
  },
});

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
    verificationCode: {
      type: String,
    },
    role: {
      type: String,
      enum: ["Customer", "Admin"],
      default: "Customer",
    },
    address: {
      type: [AddressSchema],
    },
    defaultAddress: {
      type: AddressSchema,
    },
    orders: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Order",
    },
    cart: {
      type: [cartSchema],
    },
    wishlist: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Product",
      default: [],
    },
  },
  { timestamps: true },
);

const User = model("User", UserSchema);
export default User;
