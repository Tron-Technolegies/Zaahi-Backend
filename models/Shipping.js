import { model, Schema } from "mongoose";

const ShippingSchema = new Schema(
  {
    shippingRate: {
      type: Number,
    },
    VAT: {
      type: Number,
    },
  },
  { timestamps: true },
);

const Shipping = new model("Shipping", ShippingSchema);
export default Shipping;
