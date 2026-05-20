import mongoose from "mongoose";
import Product from "../models/Product.js";
import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import razorpay from "../services/razorpay.js";
import Payment from "../models/Payment.js";
import crypto from "crypto";
import ExchangeRate from "../models/ExchangeRate.js";
import { sendMail, transporter } from "../services/nodeMailer.js";

export const createRazorPayOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, address, currency } = req.body;
    let exchange;
    if (currency === "AED") {
      exchange = await ExchangeRate.findOne().session(session);
      if (!exchange)
        throw new BadRequestError(
          "AED payments are not accepted at the moment",
        );
    }
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
        price:
          currency === "INR"
            ? variant.price
            : currency === "AED" && exchange
              ? variant.price * exchange?.INRtoAED
              : variant.price,
      });
    }
    const addressObj = JSON.parse(address);
    let user;
    if (req.user.userId) {
      user = await User.findById(req.user.userId).session(session);
      if (!user) throw new NotFoundError("No user found");
    }

    const order = new Order({
      user: req.user.userId || undefined,
      username: req.user.name || addressObj.name || undefined,
      userEmail: user.email || addressObj.email || undefined,
      totalPrice:
        currency === "INR"
          ? totalPrice
          : currency === "AED" && exchange
            ? Math.ceil(totalPrice * exchange?.INRtoAED)
            : totalPrice,
      currency,
      orderItems: orderItems,
      address: addressObj,
      paymentStatus: "pending",
    });

    let razorPayAmount =
      currency === "INR"
        ? totalPrice
        : currency === "AED" && exchange
          ? Math.ceil(totalPrice * exchange?.INRtoAED)
          : totalPrice;
    const razorPayOrder = await razorpay.orders.create({
      amount: razorPayAmount * 100,
      currency: currency || "INR",
      receipt: `order_${order._id}`,
    });

    const payment = new Payment({
      order: order._id,
      user: req.user.userId || undefined,
      username: req.user.name || addressObj.name || undefined,
      paymentIntentId: razorPayOrder.id,
      amount:
        currency === "INR"
          ? totalPrice
          : currency === "AED" && exchange
            ? Math.ceil(totalPrice * exchange?.INRtoAED)
            : totalPrice,
      currency,
      status: "pending",
    });
    if (user) {
      user.cart = [];
      await user.save({ session });
    }
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
    let user;
    if (order.user) {
      const user = await User.findById(order.user);
      if (!user) throw new NotFoundError("User not found");
    }
    const orderedItems = order.orderItems
      .map(
        (item) =>
          `Product: ${item.productName} | Qty: ${item.qty} | Size: ${item.variant.size}`,
      )
      .join("\n");
    const mailOptions = {
      from: {
        name: "Zaahi Designs",
        address: process.env.NODEMAILER_EMAIL,
      },
      to: "zaahidesigns@gmail.com",
      subject: "New Order Placed",
      text: `A new order has been placed Order Id: ${order._id}
      
      Ordered Items:
${orderedItems}
      `,
    };
    const mailOptions2 = {
      from: {
        name: "Zaahi Designs",
        address: process.env.NODEMAILER_EMAIL,
      },
      to: user ? user.email : order.userEmail,
      subject: "New Order Placed",
      text: `
Thank you for your order.

Order ID: ${order._id}

Ordered Items:
${orderedItems}

Your order has been confirmed successfully.

You can view the status of your order in the following link:

https://zaahidesigns.com/orders/order-status/${order._id}
  `,
    };
    await sendMail(transporter, mailOptions);
    await sendMail(transporter, mailOptions2);
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
