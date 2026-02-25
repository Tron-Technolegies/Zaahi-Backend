import { NotFoundError } from "../errors/customErrors.js";
import User from "../models/User.js";

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const { userId } = req.user;
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("No User Found");
    // user.cart.push({ product: productId, qty: 1 });
    const existingItem = user.cart.find(
      (item) => item.product.toString() === productId,
    );

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      user.cart.push({ product: productId, qty: 1 });
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
    const user = await User.findById(userId).populate(
      "cart.product",
      "productName image price stock",
    );
    if (!user) throw new NotFoundError("No user found");
    // res.status(200).json(user.cart);
    res.status(200).json({
      cart: user.cart,
      totalItems: user.cart.length,
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
    // item.qty = qty;
    if (qty < 1) {
      user.cart = user.cart.filter((i) => i._id.toString() !== itemId);
    } else {
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
