import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const getUserInfo = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId)
      .select("username email phoneNumber role cart")
      .lean();
    if (!user) throw new NotFoundError("No user found");
    res.status(200).json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { search, currentPage } = req.query;
    const queryObject = { role: { $ne: "Admin" } };
    if (search && search !== "") {
      const searchRegex = new RegExp(search, "i");

      queryObject.$or = [{ username: searchRegex }, { email: searchRegex }];
    }
    const page = Number(currentPage || 1);
    const limit = 2;
    const skip = (page - 1) * limit;
    const users = await User.find(queryObject)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);
    const totalUsers = await User.countDocuments(queryObject);
    const totalPages = Math.ceil(totalUsers / limit);
    res.status(200).json({ users, totalPages, totalUsers });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { username, email, phoneNumber } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) throw new NotFoundError("No user found");
    user.username = username;
    user.email = email.toLowerCase();
    user.phoneNumber = phoneNumber;
    await user.save();
    res.status(200).json({ message: "success" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirm } = req.body;
    if (newPassword !== confirm)
      throw new BadRequestError("Passwords doesnt match");
    const user = await User.findById(req.user.userId);
    if (!user) throw new NotFoundError("User not found");
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new BadRequestError("Current Password is Invalid");
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    user.password = hashed;
    await user.save();
    res.status(200).json({ message: "Success" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
