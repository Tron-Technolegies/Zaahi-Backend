import { NotFoundError } from "../errors/customErrors.js";
import User from "../models/User.js";

export const addAddress = async (req, res) => {
  try {
    const { name, street, state, country, pin, phone } = req.body;
    const { userId } = req.user;
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("No User Found");
    const newAddress = {
      name,
      street,
      state,
      country,
      pin,
      phone,
    };
    if (user.address.length < 1) {
      user.defaultAddress = newAddress;
    }
    user.address.push(newAddress);

    await user.save();

    res.status(200).json({
      message: "Address added successfully",
      newAddress,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { userId } = req.user;
    const { name, street, state, country, pin, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("No user Found");
    const address = user.address.find(
      (addr) => addr._id.toString() === addressId.toString(),
    );
    console.log(user.address);
    if (!address) throw new NotFoundError("Address not found");
    if (name) address.name = name;
    if (street) address.street = street;
    if (state) address.state = state;
    if (country) address.country = country;
    if (pin) address.pin = pin;
    if (phone) address.phone = phone;

    await user.save();

    res.status(200).json({
      message: "Address updated successfully",
      address: address,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const removeAddress = async (req, res) => {
  try {
    const { userId } = req.user;
    const { addressId } = req.params;
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("No user Found");

    user.address = user.address.filter(
      (address) => address._id.toString() !== addressId.toString(),
    );

    await user.save();

    res.status(200).json({
      message: "Address removed",
      addresses: user.address,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const makeDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { userId } = req.user;

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("No user found");

    const address = user.address.find(
      (addr) => addr._id.toString() === addressId.toString(),
    );

    if (!address) {
      throw new NotFoundError("Address not found");
    }

    // set as default
    user.defaultAddress = address;

    await user.save();

    res.status(200).json({
      message: "Default address updated successfully",
      defaultAddress: user.defaultAddress,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
export const getAddresses = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId).select("address defaultAddress");

    if (!user) throw new NotFoundError("No user Found");

    res.status(200).json({
      addresses: user.address,
      defaultAddress: user.defaultAddress,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
