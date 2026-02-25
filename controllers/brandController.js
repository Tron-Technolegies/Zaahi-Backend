import { NotFoundError } from "../errors/customErrors.js";
import Brand from "../models/Brand.js";

export const addNewBrand = async (req, res) => {
  try {
    const { brandName } = req.body;
    const newBrand = new Brand({
      brandName: brandName,
    });
    await newBrand.save();
    res.status(200).json({ message: "success", newBrand });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });
    res.status(200).json(brands);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getSingleBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id);
    if (!brand) throw new NotFoundError("No Brand Found");
    res.status(200).json(brand);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const editBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandName } = req.body;
    const brand = await Brand.findByIdAndUpdate(
      id,
      { brandName: brandName },
      { new: true }
    );
    if (!brand) throw new NotFoundError("No brand Found");
    res.status(200).json({ message: "Updated Successfully", brand });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) throw new NotFoundError("No brand Found");
    res.status(200).json({ message: "Deleted Successfully", brand });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
