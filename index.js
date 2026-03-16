import * as dotenv from "dotenv";

dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import brandRouter from "./routes/brandRouter.js";
import categoryRouter from "./routes/categoryRouter.js";
import productRouter from "./routes/productRouter.js";
import cartRouter from "./routes/cartRouter.js";
import addressRouter from "./routes/addressRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import purchaseRouter from "./routes/purchaseRouter.js";
import couponRouter from "./routes/couponRouter.js";
import wishlistRouter from "./routes/wishlistRouter.js";
import orderRouter from "./routes/orderRouter.js";
import paymentRouter from "./routes/paymentRouter.js";
import { v2 as cloudinary } from "cloudinary";
import errorHandleMiddleware from "./middlewares/errorHandlingMiddleware.js";

import {
  authenticateUser,
  isAdmin,
} from "./middlewares/authenticationMiddleware.js";
import cookieParser from "cookie-parser";
import { stripeWebhook } from "./controllers/paymentController.js";

const app = express();
const port = 3000;

app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:4000",
        "http://localhost:5174",
        "http://localhost:5175",
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.use(express.urlencoded({ extended: true }));
//for extracting the cookie
app.use(cookieParser());
//cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_USER,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  res.send("<h1>Welcome to API Services</h1>");
});
//Our API Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", authenticateUser, userRouter);
app.use("/api/v1/brand", brandRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/cart", authenticateUser, cartRouter);
app.use("/api/v1/address", authenticateUser, addressRouter);
app.use("/api/v1/review", authenticateUser, reviewRouter);
app.use("/api/v1/purchase", authenticateUser, purchaseRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/wishlist", authenticateUser, wishlistRouter);
app.use("/api/v1/payment", authenticateUser, paymentRouter);
app.use("/api/v1/coupon", authenticateUser, isAdmin, couponRouter);

//404 error handling
app.use("/*path", (req, res) => {
  res.status(404).json({ error: "Route not Found..!!!" });
});

//global error handler
app.use(errorHandleMiddleware);
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Database Connected Successfully..");
  app.listen(port, () => {
    console.log(`server started listening at port ${port}`);
  });
} catch (error) {
  console.log(error);
  process.exit(1);
}
