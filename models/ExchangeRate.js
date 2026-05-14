import { model, Schema } from "mongoose";

const ExchangeRateSchema = new Schema(
  {
    INRtoUSD: {
      type: Number,
    },
    INRtoAED: {
      type: Number,
    },
  },
  { timestamps: true },
);

const ExchangeRate = model("ExchangeRate", ExchangeRateSchema);
export default ExchangeRate;
