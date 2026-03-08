import { Router } from 'express';
import {
  addNewCoupon,
  deleteCoupon,
  editCoupon,
  getAllCoupons,
  getSingleCoupon,
} from '../controllers/CouponController.js';

const router = Router();
router.post('/', addNewCoupon);
router.get('/', getAllCoupons);
router.get('/:id', getSingleCoupon);
router.patch('/:id', editCoupon);
router.delete('/:id', deleteCoupon);

export default router;
