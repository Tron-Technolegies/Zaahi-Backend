import { model, Schema } from "mongoose";

const BrandSchema = new Schema(
  {
    brandName: {
      type: String,
    },
  },
  { timestamps: true }
);

const Brand = model("Brand", BrandSchema);
export default Brand;
