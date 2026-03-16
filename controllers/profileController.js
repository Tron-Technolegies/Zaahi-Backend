import User from '../models/User.js';
import { formatImage } from '../middlewares/multerMiddleware.js';
import { v2 as cloudinary } from 'cloudinary';
import { NotFoundError } from '../errors/customErrors.js';

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const { username, phoneNumber } = req.body;

    // Upload avatar if provided
    if (req.file) {
      const file = formatImage(req.file);

      // delete old avatar if exists
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      }

      const response = await cloudinary.uploader.upload(file);

      user.avatar = response.secure_url;
      user.avatarPublicId = response.public_id;
    }

    // Update other fields
    if (username) user.username = username;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();

    res.status(200).json({
      message: 'Profile updated',
      user,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
