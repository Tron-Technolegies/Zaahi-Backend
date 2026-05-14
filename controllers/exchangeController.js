import { NotFoundError } from "../errors/customErrors.js";
import ExchangeRate from "../models/ExchangeRate.js";

export const getExchangeRate = async (req, res) => {
  try {
    const exchangeRate = await ExchangeRate.findOne();
    if (!exchangeRate) throw new NotFoundError("No exchange rate found");
    res.status(200).json(exchangeRate);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
