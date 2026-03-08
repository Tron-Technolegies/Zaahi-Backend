import { NotFoundError } from '../errors/customErrors.js';
import Coupon from '../models/Coupon.js';

export const addNewCoupon = async (req, res) => {
  try {
    const { code, type, value, expiryDate, status, usage } = req.body;
    const newCoupon = new Coupon({
      code,
      type,
      value,
      expiryDate,
      status,
      usage,
    });
    await newCoupon.save();
    res.status(200).json({ message: 'success', newCoupon });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getSingleCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new NotFoundError('No coupon Found');
    res.status(200).json(coupon);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const editCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, type, value, expiryDate, usage, status } = req.body;
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { code, type, value, expiryDate, usage, status },
      { new: true },
    );
    if (!coupon) throw new NotFoundError('No coupon found');
    res.status(200).json({ message: 'Updated Successfully', coupon });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) throw new NotFoundError('Coupon Does not exist');
    res.status(200).json({ message: 'Deleted Successfully', coupon });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
