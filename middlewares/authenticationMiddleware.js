import {
  UnauthenticatedError,
  UnauthorizedError,
} from "../errors/customErrors.js";
import jwt from "jsonwebtoken";

export const authenticateUser = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) throw new UnauthenticatedError("Unable to access");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    throw new UnauthenticatedError("Invalid authorization");
  }
};

export const authenticateRazorPay = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } else {
      const reqBody = req.body;
      const address = JSON.parse(reqBody.address);
      req.user = { name: address?.name };
    }
    next();
  } catch (error) {
    console.log(error);
    throw new UnauthenticatedError("Invalid authorization");
  }
};

//isAdmin
export const isAdmin = async (req, res, next) => {
  if (req.user.role !== "Admin") {
    throw new UnauthorizedError("Not an Admin");
  }
  next();
};
