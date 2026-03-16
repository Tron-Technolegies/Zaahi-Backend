import mongoose from "mongoose";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { createStripePaymentIntent } from "../services/stripeService.js";

export const createPaymentIntent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, totalPrice, address, currency } = req.body;
    const itemObj = JSON.parse(items);
    const addressObj = JSON.parse(address);
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

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;

      const payment = await Payment.findOne({
        paymentIntentId: paymentIntent.id,
      });

      if (!payment) break;
      if (payment.status === "succeeded") {
        return res.json({ received: true });
      }

      payment.status = "succeeded";
      payment.paymentMethod = paymentIntent.payment_method;

      await payment.save();

      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: "paid",
        status: "Confirmed",
      });

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;

      await Payment.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { status: "failed" },
      );

      break;
    }
    case "payment_intent.canceled": {
      const intent = event.data.object;

      await Payment.findOneAndUpdate(
        { paymentIntentId: intent.id },
        { status: "cancelled" },
      );

      break;
    }
  }

  res.json({ received: true });
};
