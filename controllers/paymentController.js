import stripe from "../config/stripe.js";
import User from "../models/User.js";
import { BadRequestError } from "../errors/customErrors.js";
export const createPaymentIntent = async (req, res) => {
  const user = await User.findById(req.user.userId).populate(
    "cart.product",
    "price stock",
  );

  if (!user.cart.length) {
    throw new BadRequestError("Cart is empty");
  }

  let totalAmount = 0;

  for (const item of user.cart) {
    if (item.product.stock < item.qty) {
      throw new BadRequestError("Product out of stock");
    }
    totalAmount += item.product.price * item.qty;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100,
    currency: "inr",
  });

  res.json({
    clientSecret: paymentIntent.client_secret,
    amount: totalAmount,
  });
};
