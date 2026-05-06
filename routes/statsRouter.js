import express from "express";
import {
  getCategoryStats,
  getCustomerGrowth,
  getDashboardOverview,
  getRevenueChart,
  getTopSellingProducts,
} from "../controllers/statsController.js";

const router = express.Router();

router.get("/overview", getDashboardOverview);

router.get("/revenue-chart", getRevenueChart);

router.get("/top-products", getTopSellingProducts);

router.get("/customer-growth", getCustomerGrowth);

router.get("/category-stats", getCategoryStats);

export default router;
