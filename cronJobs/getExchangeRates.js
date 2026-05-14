import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { BadRequestError } from "../errors/customErrors.js";
import ExchangeRate from "../models/ExchangeRate.js";

export const getExchangeRates = async () => {
  try {
    const response = await axios.get(
      `https://api.exchangerate.host/live?source=INR&currency=USD,AED&access_key=${process.env.EXCHANGE_KEY}`,
    );
    const data = response.data;
    if (!data || !data.quotes)
      throw new BadRequestError("No data found on exchange api");
    const existing = await ExchangeRate.findOne();
    if (!existing) {
      const newExchange = new ExchangeRate({
        INRtoAED: data.quotes?.INRAED,
        INRtoUSD: data.quotes?.INRUSD,
      });
      await newExchange.save();
    } else {
      existing.INRtoAED = data.quotes?.INRAED;
      existing.INRtoUSD = data.quotes?.INRUSD;
      await existing.save();
    }
    console.log("Successfully fetched Exchange rates");
  } catch (error) {
    console.log("Failed cron job for fetching exchange rate", error.message);
  }
};
