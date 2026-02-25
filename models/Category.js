import { model, Schema } from "mongoose";

const CategorySchema = new Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Category = model("Category", CategorySchema);
export default Category;
