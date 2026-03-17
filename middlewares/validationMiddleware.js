import { body, validationResult } from "express-validator";
import { BadRequestError } from "../errors/customErrors.js";
import User from "../models/User.js";

const withValidationErrors = (validateValues) => {
  return [
    validateValues,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        throw new BadRequestError(errorMessages);
      }
      next();
    },
  ];
};

//validation for register user
export const validateRegister = withValidationErrors([
  body("username").notEmpty().withMessage("Username is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid Email format")
    .custom(async (email) => {
      const isAlreadyExist = await User.findOne({ email: email });
      if (isAlreadyExist) throw new BadRequestError("Email Exists");
    }),
  body("password").notEmpty().withMessage("Password is required"),
  body("phone").notEmpty().withMessage("Phone is required"),
]);

export const validateLogin = withValidationErrors([
  body("username").notEmpty().withMessage("Username is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid Email format"),
  body("password").notEmpty().withMessage("Password is required"),
]);

//Brand
export const validateAddBrand = withValidationErrors([
  body("brandName").notEmpty().withMessage("Brand name is required"),
]);

//category

export const validateAddCategory = withValidationErrors([
  body("categoryName").notEmpty().withMessage("Category name is required"),
]);

//product
export const validateAddProduct = withValidationErrors([
  body("name").notEmpty().withMessage("Product name is required"),
  body("price").notEmpty().withMessage("Price name is required"),
  // body("description").notEmpty().withMessage("Description name is required"),
  body("category").notEmpty().withMessage("Category name is required"),

  // body("brand").notEmpty().withMessage("Brand name is required"),
  body("stock").notEmpty().withMessage("Stock name is required"),
  body("status").notEmpty().withMessage("status  is required"),
]);

export const validateAddCart = withValidationErrors([
  body("productId")
    .notEmpty()
    .withMessage("Product Id is required")
    .isMongoId()
    .withMessage("Incorrect Id"),
]);

export const validateUpdateCart = withValidationErrors([
  body("itemId")
    .notEmpty()
    .withMessage("Item Id is required")
    .isMongoId()
    .withMessage("Incorrect Id"),
  body("qty").notEmpty().withMessage("Quantity Id is required"),
]);

export const validateRemoveFromCart = withValidationErrors([
  body("itemId")
    .notEmpty()
    .withMessage("Item Id is required")
    .isMongoId()
    .withMessage("Incorrect Id"),
]);

export const validateAddAddress = withValidationErrors([
  body("name").notEmpty().withMessage("Name is required"),
  body("street").notEmpty().withMessage("Street is required"),
  body("state").notEmpty().withMessage("State is required"),
  body("country").notEmpty().withMessage("Country is required"),
  body("pin").notEmpty().withMessage("Pin is required"),
  body("phone").notEmpty().withMessage("Phone is required"),
]);

export const validatePurchaseAddress = withValidationErrors([
  body("address").notEmpty().withMessage("Address is required"),
]);

//validate payment
export const validateCreatePayment = withValidationErrors([
  body("items").notEmpty().withMessage("Items is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("currency").notEmpty().withMessage("Currency is required"),
]);

export const validateUpdateUserProfile = withValidationErrors([
  body("username").notEmpty().withMessage("username is required"),
  body("phoneNumber").notEmpty().withMessage("phoneNumber is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .custom(async (email, { req }) => {
      const user = await User.findOne({ email: email });
      if (user && user._id.toString() !== req.user.userId.toString()) {
        throw new BadRequestError("email already exists");
      }
    }),
]);
