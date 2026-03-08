import { model, Schema } from 'mongoose';

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Percentage', 'Fixed'],
      default: 'Percentage',
    },
    value: { type: Number, required: true },
    expiryDate: {
      type: Date,
      required: true,
    },
    usage: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Scheduled', 'Expired'],
      default: 'Active',
    },
  },
  { timestamps: true },
);

const Coupon = model('Coupon', CouponSchema);
export default Coupon;
