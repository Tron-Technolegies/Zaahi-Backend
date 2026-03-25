import { formatImage } from "../middlewares/multerMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { NotFoundError } from "../errors/customErrors.js";
import { cleanupCloudinaryImages } from "../services/cloudinary.js";

export const addProduct = async (req, res) => {
  let uploadedPublicIds = [];
  try {
    const {
      name,
      price,
      description,
      category,
      size,
      brand,
      isFeatured,
      specs,
    } = req.body;
    const uploadSingle = async (file) => {
      const formatted = formatImage(file);
      const res = await cloudinary.uploader.upload(formatted);
      uploadedPublicIds.push(res.public_id);
      return {
        url: res.secure_url,
        publicId: res.public_id,
      };
    };
    const data = {
      image: null,
      extraImages: [],
    };
    if (req.files?.image?.[0]) {
      data.image = await uploadSingle(req.files.image[0]);
    }
    if (req.files?.extraImages?.length > 0) {
      data.extraImages = await Promise.all(
        req.files.extraImages.map((file) => uploadSingle(file)),
      );
    }
    const newProduct = new Product({
      productName: name,
      basePrice: price,
      category,
      brand: brand,
      description: description,
      variants: size ? JSON.parse(size) : [],
      image: data.image,
      extraImages: data.extraImages,
      isFeatured: Boolean(isFeatured) || false,
      specification: specs ? JSON.parse(specs) : [],
    });

    await newProduct.save();
    res.status(200).json({ message: "product added", newProduct });
  } catch (error) {
    await cleanupCloudinaryImages(uploadedPublicIds);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { search, currentPage, category, minPrice, maxPrice, sortBy } =
      req.query;
    const queryObject = {};
    if (search) {
      queryObject.productName = { $regex: search, $options: "i" };
    }
    if (category && category !== "ALL") {
      queryObject.category = category;
    }
    if (minPrice && maxPrice) {
      queryObject.basePrice = { $lte: maxPrice, $gte: minPrice };
    }
    let sortKey = { createdAt: -1 };
    if (sortBy === "ascending") {
      sortKey = { price: -1 };
    }
    if (sortBy === "descending") {
      sortKey = { price: 1 };
    }
    const page = Number(currentPage) || 1;
    const limit = 10;
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
  let uploadedPublicIds = [];
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) throw new NotFoundError("No product Found");
    const {
      name,
      price,
      description,
      category,
      size,
      brand,
      isFeatured,
      specs,
    } = req.body;
    const uploadSingle = async (file) => {
      const formatted = formatImage(file);
      const res = await cloudinary.uploader.upload(formatted);
      uploadedPublicIds.push(res.public_id);
      return {
        url: res.secure_url,
        publicId: res.public_id,
      };
    };
    const data = {
      image: product.image || null,
      extraImages: product.extraImages || [],
    };

    console.log(req.files);

    if (req.files?.image?.[0]) {
      if (data.image?.publicId) {
        await cloudinary.uploader.destroy(data.image.publicId);
      }
      data.image = await uploadSingle(req.files.image[0]);
    }
    if (req.files?.extraImages?.length > 0) {
      const newImages = await Promise.all(
        req.files.extraImages.map((file) => uploadSingle(file)),
      );
      data.extraImages = [...data.extraImages, ...newImages];
    }
    product.productName = name;

    product.basePrice = price;
    product.description = description;
    product.category = category;
    product.brand = brand;
    product.isFeatured = isFeatured ? Boolean(isFeatured) : false;
    product.variants = size ? JSON.parse(size) : [];
    product.specification = specs ? JSON.parse(specs) : [];
    product.image = data.image;
    product.extraImages = data.extraImages;
    await product.save();
    res.status(200).json({ message: "Updated Successfully", product });
  } catch (error) {
    await cleanupCloudinaryImages(uploadedPublicIds);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw new NotFoundError("No product Found");
    if (product.image?.publicId) {
      await cloudinary.uploader.destroy(product.image.publicId);
    }
    if (product.extraImages.length > 0) {
      await Promise.all(
        product.extraImages.map((item) =>
          cloudinary.uploader.destroy(item.publicId),
        ),
      );
    }
    res.status(200).json({ message: "Deleted Successfully", product });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const deleteImage = async (req, res) => {
  try {
    const { publicId, productId, imageType } = req.body;
    const product = await Product.findById(productId);
    if (!product) throw new NotFoundError("No product found");
    if (imageType === "image") {
      await cloudinary.uploader.destroy(publicId);
      product.image = null;
      await product.save();
      return res.status(200).json({ msg: "Image deleted successfully" });
    } else if (imageType === "extraImages") {
      await cloudinary.uploader.destroy(publicId);
      product.extraImages = product.extraImages.filter(
        (item) => item.publicId !== publicId,
      );
      await product.save();
      return res.status(200).json({ msg: "Image deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ msg: error.msg || error.message });
  }
};
