import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { NotFoundError, BadRequestError } from "../errors/customErrors.js";
import mongoose from "mongoose";

export const purchaseProduct = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { userId } = req.user;
    const user = await User.findById(userId)
      .populate("cart.product", "productName price stock")
      .session(session);
    if (!user) throw new NotFoundError("User not found");

    const { address } = req.body;
    if (user.cart.length < 1) throw new BadRequestError("Cart is Empty");
    let grandTotal = 0;
    let purchaseItems = user.cart;
    for (let cartItem of user.cart) {
      const { product, qty } = cartItem;
      if (product.stock < qty)
        throw new BadRequestError("Product Out of stock");
      const totalPrice = product.price * qty;
      const prdt = await Product.findById(product._id).session(session);
      prdt.stock = prdt.stock - qty;
      // Create order
      const newOrder = new Order({
        user: userId,
        product: product._id,
        qty,
        totalPrice,
        status: "Confirmed",
        address: address,
      });
      grandTotal = grandTotal + totalPrice;
      await prdt.save({ session });
      await newOrder.save({ session });
      user.orders.push(newOrder._id);
    }

    user.cart = [];
    await user.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ purchaseItems, grandTotal });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
