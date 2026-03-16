import express from 'express';

import upload from '../middlewares/multerMiddleware.js';
import { updateProfile } from '../controllers/profileController.js';

const router = express.Router();

router.put(
  '/update-profile',

  upload.single('avatar'),
  updateProfile,
);

export default router;
