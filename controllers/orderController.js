import mongoose from "mongoose";
import User from "../models/User.js";

import { SEE_OTHER } from "http-status-codes";
import Order from "../models/Order.js";
import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import Product from "../models/Product.js";

// export const purchaseItem = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const { userId } = req.user;
//     const user = await User.findById(userId)
//       .populate("cart.product", "productName price stock")
//       .session(session);
//     if (!user) throw new NotFoundError("no user found");
//     const { address } = req.body;
//     if (user.cart.length < 1) throw new BadRequestError("cart is Empty");
//     let grandTotal = 0;
//     let purchaseItem = user.cart;
//     for (let cartItem of user.cart) {
//       const { product, qty } = cartItem;
//       if (product.stock < qty)
//         throw new BadRequestError("product out of Stock");
//       const totalPrice = product.price * qty;
//       const newOrder = new Order({
//         product: product._id,
//         user: userId,
//         qty: qty,
//         totalPrice: totalPrice,
//         status: "Confirmed",
//         address: address,
//       });
//       grandTotal = grandTotal + totalPrice;
//       await product.save({ session });
//       await newOrder.save({ session });
//       user.orders.push(newOrder._id);
//     }
//     user.cart = [];
//     await user.save({ session });
//     await session.commitTransaction();
//     session.endSession();
//     res.status(200).json({ purchaseItem, grandTotal });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     res.status(error.statusCode || 500).json({ error: error.message });
//   }
// };

// export const confirmOrder = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const { paymentId, address } = req.body;
//     const userId = req.user.userId;

//     if (!paymentId) {
//       throw new BadRequestError("Payment ID is required");
//     }

//     const user = await User.findById(userId)
//       .populate("cart.product", "productName price stock")
//       .session(session);

//     if (!user) throw new NotFoundError("User not found");
//     if (user.cart.length === 0) throw new BadRequestError("Cart is empty");

//     let grandTotal = 0;

//     for (const cartItem of user.cart) {
//       const { product, qty } = cartItem;

//       if (product.stock < qty) {
//         throw new BadRequestError(`${product.productName} is out of stock`);
//       }

//       const totalPrice = product.price * qty;

//       const newOrder = new Order({
//         user: userId,
//         product: product._id,
//         qty,
//         totalPrice,
//         paymentId,
//         status: "Confirmed",
//         address,
//       });

//       product.stock -= qty;
//       grandTotal += totalPrice;

//       await product.save({ session });
//       await newOrder.save({ session });

//       user.orders.push(newOrder._id);
//     }

//     user.cart = [];
//     await user.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       success: true,
//       message: "Order placed successfully",
//       grandTotal,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     res.status(error.statusCode || 500).json({ error: error.message });
//   }
// };

export const getAllOrders = async (req, res) => {
  try {
    const { currentPage, status } = req.query;
    const queryObject = {};
    if (status && status !== "ALL") {
      queryObject.status = status;
    }
    const page = Number(currentPage) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    const orders = await Order.find(queryObject)
      .sort({ createdAt: -1 })
      .populate("user", "username email")
      // .populate("product", "productName")
      .skip(skip)
      .limit(limit);
    const totalOrders = await Order.countDocuments(queryObject);
    const totalPages = Math.ceil(totalOrders / limit);
    res.status(200).json({ totalOrders, totalPages, orders });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getAllUserOrders = async (req, res) => {
  try {
    const { currentPage, status } = req.query;

    const queryObject = { user: req.user.userId };

    if (status && status !== "ALL") {
      queryObject.status = status;
    }

    const page = Number(currentPage) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find(queryObject)
      .sort({ createdAt: -1 })
      .populate("orderItems.product", "productName price image")
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(queryObject);
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({ orders, totalOrders, totalPages });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const validStatus = [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    const order = await Order.findById(orderId);
    if (!order) throw new NotFoundError("No order Found");
    order.status = status;
    await order.save();
    const populateOrder = await Order.findById(orderId)
      .populate("user", "username")
      .populate("product", "productName price");
    res.status(200).json({
      message: "order status updated successfully",
      order: populateOrder,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);
  if (!order) {
    throw new BadRequestError("Order not found");
  }
  if (order.user.toString() !== req.user.userId) {
    throw new BadRequestError("You are not allowed to cancel this order");
  }
  if (
    order.status === "Shipped" ||
    order.status === "Delivered" ||
    order.status === "Cancelled"
  ) {
    throw new BadRequestError(
      `order cannot be cancelled when status is ${order.status}`,
    );
  }
  const product = await Product.findById(order.product);
  if (!product) {
    throw new NotFoundError("Product Not found");
  }
  product.stock += order.qty;
  await product.save();

  order.status = "Cancelled";
  await order.save();

  res.status(200).json({
    message: "Order cancelled and stock updated successfully",
    order,
  });
};

export const getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw new NotFoundError("No order found");
    res.status(200).json(order);
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ message: error.message || error.msg });
  }
};
