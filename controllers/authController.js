import { BadRequestError } from '../errors/customErrors.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
//register
export const registerUser = async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const newUser = new User({
      username: username,
      password: hash,
      email: email.toLowerCase(),
      phoneNumber: phone,
    });
    await newUser.save();
    res.status(200).json({ message: 'New user created successfully', newUser });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

//login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) throw new BadRequestError('No user found');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new BadRequestError('Invalid credentials');
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );
    res.cookie('token', token, {
      httpOnly: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000 * 30),
      secure: process.env.NODE_ENV === 'production',
    });
    res.status(200).json({ message: 'Logged in success' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

//logout
export const logout = async (req, res) => {
  try {
    res.cookie('token', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now()),
      secure: process.env.NODE_ENV === 'production',
    });
    res.status(200).json({ message: 'Logged Out success' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) throw new NotFoundError('User not found');

    // check old password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
