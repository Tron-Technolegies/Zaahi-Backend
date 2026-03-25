import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

export const addToCart = async (req, res) => {
  try {
    const { productId, size } = req.body;
    const { userId } = req.user;
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("No User Found");

    const product = await Product.findById(productId);
    if (!product) throw new NotFoundError("Product Not Found");

    const variant = product.variants.find((v) => v.size === size);
    if (!variant) throw new NotFoundError("Variant not found");
    // user.cart.push({ product: productId, qty: 1 });
    const existingItem = user.cart.find(
      (item) =>
        item.product.toString() === productId && item.variant.size === size,
    );

    if (existingItem) {
      if (existingItem.qty + 1 > variant.stock) {
        throw new BadRequestError("Stock limit reached");
      }
      existingItem.qty += 1;
    } else {
      user.cart.push({ product: productId, qty: 1, variant: { size } });
    }

    await user.save();
    res.status(200).json({ message: "Item added to cart", cart: user.cart });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getAllCartItems = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).populate("cart.product");
    if (!user) throw new NotFoundError("No user found");
    // res.status(200).json(user.cart);
    const cart = user.cart.map((item) => {
      const product = item.product;
      const variant = product.variants.find(
        (v) => v.size === item.variant.size,
      );
      return {
        _id: item._id,
        productId: product._id,
        productName: product.productName,
        image: product.image?.url,
        size: item.variant.size,
        qty: item.qty,
        price: variant?.price,
        stock: variant?.stock,
      };
    });
    res.status(200).json({
      cart,
      totalItems: cart.length,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemId, qty } = req.body;
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("No user Found");
    const item = user.cart.find(
      (item) => item._id.toString() === itemId.toString(),
    );
    if (!item) {
      throw new NotFoundError("Cart item not found");
    }

    const product = await Product.findById(item.product);
    const variant = product.variants.find((v) => v.size === item.variant.size);
    if (!variant) throw new NotFoundError("Variant Not Found");
    // item.qty = qty;
    if (qty < 1) {
      user.cart = user.cart.filter((i) => i._id.toString() !== itemId);
    } else {
      if (qty > variant.stock) {
        throw new BadRequestError("Stock limit Exceeded");
      }
      item.qty = qty;
    }

    await user.save();
    res.status(200).json({ message: "Updated", cart: user.cart });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// export const removeFromCart = async (req, res) => {
//   try {
//     const { userId } = req.user;
//     const { itemId, qty } = req.body;
//     const user = await User.findById(userId);
//     if (!user) throw new NotFoundError("No user Found");
//     user.cart = user.cart.filter(
//       (item) => item._id.toString() !== itemId.toString(),
//     );
//     await user.save();
//     res.status(200).json({ message: "Removed", cart: user.cart });
//   } catch (error) {
//     res.status(error.statusCode || 500).json({ error: error.message });
//   }
// };
export const removeFromCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemId } = req.body;

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("No user Found");

    user.cart = user.cart.filter((item) => item._id.toString() !== itemId);

    await user.save();

    res.status(200).json({
      message: "Removed",
      cart: user.cart,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("No user Found");
    user.cart = [];
    await user.save();
    res.status(200).json({ message: "Cleared", cart: user.cart });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
