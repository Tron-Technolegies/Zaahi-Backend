import { NotFoundError } from '../errors/customErrors.js';
import User from '../models/User.js';

export const getUserInfo = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId)
      .select('username email phone role cart')
      .lean();
    if (!user) throw new NotFoundError('No user found');
    res.status(200).json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { search, currentPage } = req.query;
    const queryObject = { role: { $ne: 'Admin' } };
    if (search && search !== '') {
      const searchRegex = new RegExp(search, 'i');

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
