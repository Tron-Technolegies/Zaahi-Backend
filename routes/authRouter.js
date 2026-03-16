import { Router } from 'express';
import {
  changePassword,
  loginUser,
  logout,
  registerUser,
} from '../controllers/authController.js';
import { authenticateUser } from '../middlewares/authenticationMiddleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logout);
router.patch('/change-password', authenticateUser, changePassword);

export default router;
