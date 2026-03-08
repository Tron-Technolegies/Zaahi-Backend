import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import User from "../models/User.js";

export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(
      "wishlist",
      "productName price image",
    );

    res.status(200).json({
      wishlist: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) throw new NotFoundError("No user found");

    const alreadyExist = user.wishlist.find(
      (item) => item.toString() === productId.toString(),
    );
    if (alreadyExist) throw new BadRequestError("Already exists");
    user.wishlist.push(productId);
    await user.save();
    res.status(200).json({
      message: "Added to wishlist",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const user = await User.findById(req.user.userId);

    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);

    await user.save();

    res.status(200).json({
      message: "Removed from wishlist",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) throw new NotFoundError("No user found");

    user.wishlist = [];
    await user.save();

    res.status(200).json({
      message: "Wishlist cleared successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
