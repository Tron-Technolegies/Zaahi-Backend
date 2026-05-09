import mongoose from "mongoose";
import Product from "../models/Product.js";
import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import razorpay from "../services/razorpay.js";
import Payment from "../models/Payment.js";
import crypto from "crypto";

export const createRazorPayOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, address, currency } = req.body;
    const itemObj = JSON.parse(items);
    const orderItems = [];
    let totalPrice = 0;

    for (const item of itemObj) {
      const product = await Product.findById(item.product).session(session);
      if (!product) throw new NotFoundError("Product not found");
      const variant = product.variants.find((v) => v.size === item.size);
      if (!variant) throw new BadRequestError("Invalid variant");
      if (variant.stock < item.qty) {
        throw new BadRequestError("Insufficient stock");
      }
      const itemTotal = variant.price * item.qty;
      totalPrice += itemTotal;
      orderItems.push({
        product: product._id,
        productName: product.productName,
        image: product.image?.url,
        variant: {
          size: variant.size,
        },
        qty: item.qty,
        price: variant.price,
      });
    }
    const addressObj = JSON.parse(address);
    const user = await User.findById(req.user.userId).session(session);
    if (!user) throw new NotFoundError("No user found");

    const order = new Order({
      user: req.user.userId,
      totalPrice,
      currency,
      orderItems: orderItems,
      address: addressObj,
      paymentStatus: "pending",
    });

    const razorPayOrder = await razorpay.orders.create({
      amount: totalPrice * 100,
      currency: currency || "INR",
      receipt: `order_${order._id}`,
    });

    const payment = new Payment({
      order: order._id,
      user: req.user.userId,
      paymentIntentId: razorPayOrder.id,
      amount: totalPrice,
      currency,
      status: "pending",
    });
    user.cart = [];
    await user.save({ session });
    await order.save({ session });
    await payment.save({ session });

    await session.commitTransaction();
    session.endSession();
    res.json({
      orderId: razorPayOrder.id,
      amount: razorPayOrder.amount,
      currency: razorPayOrder.currency,
      key: process.env.RAZORPAY_API_KEY,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};

export const verifyRazorPayPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    if (generatedSignature !== razorpay_signature) {
      throw new BadRequestError("Invalid payment signature");
    }
    const payment = await Payment.findOne({
      paymentIntentId: razorpay_order_id,
    }).session(session);

    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.status === "succeeded") {
      await session.abortTransaction();
      session.endSession();
      return res.json({ success: true, message: "Already processed" });
    }
    await Payment.findByIdAndUpdate(
      payment._id,
      { status: "succeeded", paymentMethod: "razorpay" },
      { session },
    );
    const order = await Order.findByIdAndUpdate(
      payment.order,
      {
        paymentStatus: "paid",
        status: "Confirmed",
      },
      { new: true, session },
    );
    if (!order) throw new NotFoundError("Order not found");
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product).session(session);
      if (!product) continue;
      const variant = product.variants.find(
        (v) => v.size === item.variant.size,
      );
      if (!variant) continue;
      variant.stock = Math.max(0, variant.stock - item.qty);
      await product.save({ session });
    }
    await session.commitTransaction();
    session.endSession();
    res.json({ success: true });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message });
  }
};

export const paymentFailed = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { razorpay_order_id } = req.body;

    const payment = await Payment.findOneAndUpdate(
      { paymentIntentId: razorpay_order_id },
      { status: "cancelled" },
      { session },
    );
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Payment not found" });
    }
    await Order.findByIdAndUpdate(
      payment.order,
      {
        paymentStatus: "failed",
        status: "Cancelled",
      },
      { session },
    );
    await session.commitTransaction();
    session.endSession();
    res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: err.message });
  }
};

export const paymentCancelled = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { razorpay_order_id } = req.body;

    const payment = await Payment.findOneAndUpdate(
      { paymentIntentId: razorpay_order_id },
      { status: "cancelled" },
      { session },
    );
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Payment not found" });
    }
    await Order.findByIdAndUpdate(
      payment.order,
      {
        paymentStatus: "cancelled",
        status: "Cancelled",
      },
      { session },
    );
    await session.commitTransaction();
    session.endSession();
    res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: err.message });
  }
};
