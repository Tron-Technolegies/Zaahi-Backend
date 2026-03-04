import { formatImage } from "../middlewares/multerMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { NotFoundError } from "../errors/customErrors.js";

export const addProduct = async (req, res) => {
  try {
    const { name, price, category, size, stock, status } = req.body;
    let image = "";
    let imagePublicId = "";
    if (req.file) {
      const file = formatImage(req.file);
      const response = await cloudinary.uploader.upload(file);
      image = response.secure_url;
      imagePublicId = response.public_id;
    }
    const newProduct = new Product({
      productName: name,
      price,
      category,
      status,
      size: size?.split(",") || [],
      stock,
      image,
      imagePublicId,
    });

    await newProduct.save();
    res.status(200).json({ message: "product added", newProduct });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { search, currentPage, category, minPrice, maxPrice, sortBy } = req.query;
    const queryObject = {};
    if (search) {
      queryObject.productName = { $regex: search, $options: "i" };
    }
    if (category && category !== "ALL") {
      queryObject.category = category;
    }
    if (minPrice && maxPrice) {
      queryObject.price = { $lte: maxPrice, $gte: minPrice };
    }
    let sortKey = { createdAt: -1 };
    if (sortBy === "ascending") {
      sortKey = { price: -1 };
    }
    if (sortBy === "descending") {
      sortKey = { price: 1 };
    }
    const page = Number(currentPage) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const products = await Product.find(queryObject)

      .limit(limit)
      .skip(skip)
      .sort(sortKey);
    const totalProducts = await Product.countDocuments(queryObject);
    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({ products, totalPages, totalProducts });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) throw new NotFoundError("No product found");
    res.status(200).json(product);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) throw new NotFoundError("No product Found");
    const { productName, price, description, category, stock, status } = req.body;
    if (req.file) {
      const file = formatImage(req.file);
      if (product.imagePublicId) {
        //to delete the existing image
        await cloudinary.uploader.destroy(product.imagePublicId);
      }
      const response = await cloudinary.uploader.upload(file);
      product.image = response.secure_url;
      product.imagePublicId = response.public_id;
    }
    product.productName = productName;

    product.price = price;
    product.description = description;
    product.category = category;
    product.stock = stock;
    product.status = status;

    await product.save();
    res.status(200).json({ message: "Updated Successfully", product });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw new NotFoundError("No product Found");
    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }
    res.status(200).json({ message: "Deleted Successfully", product });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
