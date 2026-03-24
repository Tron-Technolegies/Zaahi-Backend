import mongoose from "mongoose";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { createStripePaymentIntent } from "../services/stripeService.js";
import User from "../models/User.js";
import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import Product from "../models/Product.js";
import stripe from "../config/stripe.js";

export const createPaymentIntent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, address, currency } = req.body;
    const itemObj = JSON.parse(items);
    const orderItems = [];
    let totalPrice = 0;
    for (const item of itemObj) {
      const product = await Product.findById(item);
    }
    const addressObj = JSON.parse(address);
    const user = await User.findById(req.user.userId).session(session);
    if (!user) throw new NotFoundError("No user found");
    // const totalPrice = itemObj.reduce(
    //   (sum, item) => sum + item.qty * item.price,
    //   0,
    // );
    const order = new Order({
      user: req.user.userId,
      totalPrice,
      currency,
      orderItems: itemObj,
      address: addressObj,
    });
    const paymentIntent = await createStripePaymentIntent({
      amount: order.totalPrice * 100,
      currency: order.currency,
      orderId: order._id,
      userId: req.user.userId,
    });
    order.paymentIntentId = paymentIntent.id;
    const payment = new Payment({
      order: order._id,
      user: req.user.userId,
      paymentIntentId: paymentIntent.id,
      amount: order.totalPrice,
      currency: order.currency,
    });
    user.cart = [];
    await user.save({ session });
    await order.save({ session });
    await payment.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.log("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const paymentIntent = event.data.object;

      // ✅ atomic update (idempotency safe)
      const payment = await Payment.findOneAndUpdate(
        {
          paymentIntentId: paymentIntent.id,
          status: { $ne: "succeeded" },
        },
        {
          status: "succeeded",
          paymentMethod: paymentIntent.payment_method,
        },
        { new: true, session },
      );

      if (!payment) {
        await session.abortTransaction();
        session.endSession();
        return res.json({ received: true });
      }

      const order = await Order.findByIdAndUpdate(
        payment.order,
        {
          paymentStatus: "paid",
          status: "Confirmed",
        },
        { new: true, session },
      );

      if (!order) throw new Error("Order not found");

      // ✅ deduct stock safely
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product).session(session);
        if (!product) continue;

        product.stock = Math.max(0, product.stock - item.qty);
        await product.save({ session });
      }

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Webhook error:", err);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    await Payment.findOneAndUpdate(
      { paymentIntentId: event.data.object.id },
      { status: "failed" },
    );
  }

  if (event.type === "payment_intent.canceled") {
    await Payment.findOneAndUpdate(
      { paymentIntentId: event.data.object.id },
      { status: "cancelled" },
    );
  }

  res.json({ received: true });
};
