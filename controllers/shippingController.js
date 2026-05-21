import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import Shipping from "../models/Shipping.js";

export const createNewShippingRates = async (req, res) => {
  try {
    const { vat, shipping } = req.body;
    if (!vat || !shipping)
      throw new BadRequestError("VAT and Shipping is required");
    const existing = await Shipping.findOne();
    if (!existing) {
      const newShipping = new Shipping({
        shippingRate: shipping,
        VAT: vat,
      });
      await newShipping.save();
    } else {
      existing.shippingRate = shipping;
      existing.VAT = vat;
      await existing.save();
    }
    res.status(200).json({ message: "success" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getShippingRate = async (req, res) => {
  try {
    const rates = await Shipping.findOne();
    res.status(200).json(rates);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
