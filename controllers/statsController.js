import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

export const getDashboardOverview = async (req, res) => {
  try {
    // =========================
    // TOTAL REVENUE
    // =========================
    const revenueData = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: "$currency",
          totalRevenue: {
            $sum: "$totalPrice",
          },
        },
      },
    ]);

    const totalRevenue = {
      INR: 0,
      AED: 0,
    };

    revenueData.forEach((item) => {
      totalRevenue[item._id] = item.totalRevenue;
    });

    // =========================
    // TOTAL ORDERS
    // =========================
    const totalOrders = await Order.countDocuments();

    // =========================
    // TOTAL CUSTOMERS
    // =========================
    const totalCustomers = await User.countDocuments({
      role: "Customer",
    });

    // =========================
    // TOTAL PRODUCTS
    // =========================
    const totalProducts = await Product.countDocuments();

    // =========================
    // RECENT ORDERS
    // =========================
    const recentOrders = await Order.find()
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .limit(5);

    // =========================
    // LOW STOCK PRODUCTS
    // =========================
    const lowStockProducts = await Product.aggregate([
      {
        $unwind: "$variants",
      },
      {
        $match: {
          "variants.stock": {
            $lte: 5,
          },
        },
      },
      {
        $project: {
          productName: 1,
          variant: "$variants",
        },
      },
      {
        $limit: 10,
      },
    ]);

    // =========================
    // SALES BY CATEGORY
    // =========================
    const salesByCategory = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },
      {
        $unwind: "$orderItems",
      },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $group: {
          _id: "$product.category",
          totalSales: {
            $sum: "$orderItems.qty",
          },
        },
      },
      {
        $sort: {
          totalSales: -1,
        },
      },
    ]);

    // =========================
    // ORDERS BY STATUS
    // =========================
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        recentOrders,
        lowStockProducts,
        salesByCategory,
        ordersByStatus,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
};

// ==============================
// REVENUE CHART
// DAILY / WEEKLY / MONTHLY
// ==============================

export const getRevenueChart = async (req, res) => {
  try {
    const filter = req.query.filter || "daily";

    let groupStage = {};
    let sortStage = {};

    // ==============================
    // DAILY (last 24 hours)
    // ==============================
    if (filter === "daily") {
      groupStage = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
        hour: { $hour: "$createdAt" },
      };

      sortStage = {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
        "_id.hour": 1,
      };
    }

    // ==============================
    // WEEKLY (date wise)
    // ==============================
    if (filter === "weekly") {
      groupStage = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };

      sortStage = {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
      };
    }

    // ==============================
    // MONTHLY
    // ==============================
    if (filter === "monthly") {
      groupStage = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };

      sortStage = {
        "_id.year": 1,
        "_id.month": 1,
      };
    }

    // ==============================
    // YEARLY
    // ==============================
    if (filter === "yearly") {
      groupStage = {
        year: { $year: "$createdAt" },
      };

      sortStage = {
        "_id.year": 1,
      };
    }

    const revenueChart = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },

      {
        $group: {
          _id: groupStage,

          revenue: {
            $sum: "$totalPrice",
          },

          totalOrders: {
            $sum: 1,
          },
        },
      },

      {
        $sort: sortStage,
      },

      // ==============================
      // FORMAT DATE
      // ==============================
      {
        $project: {
          _id: 0,

          revenue: 1,
          totalOrders: 1,

          date: {
            $switch: {
              branches: [
                // DAILY
                {
                  case: { $eq: [filter, "daily"] },
                  then: {
                    $concat: [
                      { $toString: "$_id.day" },
                      "/",
                      { $toString: "$_id.month" },
                      " ",
                      { $toString: "$_id.hour" },
                      ":00",
                    ],
                  },
                },

                // WEEKLY
                {
                  case: { $eq: [filter, "weekly"] },
                  then: {
                    $concat: [
                      { $toString: "$_id.day" },
                      "/",
                      { $toString: "$_id.month" },
                      "/",
                      { $toString: "$_id.year" },
                    ],
                  },
                },

                // MONTHLY
                {
                  case: { $eq: [filter, "monthly"] },
                  then: {
                    $concat: [
                      { $toString: "$_id.month" },
                      "/",
                      { $toString: "$_id.year" },
                    ],
                  },
                },

                // YEARLY
                {
                  case: { $eq: [filter, "yearly"] },
                  then: {
                    $toString: "$_id.year",
                  },
                },
              ],
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      revenueChart,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch revenue chart",
    });
  }
};

// ==============================
// TOP SELLING PRODUCTS
// ==============================

export const getTopSellingProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },
      {
        $unwind: "$orderItems",
      },
      {
        $group: {
          _id: "$orderItems.product",
          totalSold: {
            $sum: "$orderItems.qty",
          },
        },
      },
      {
        $sort: {
          totalSold: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $project: {
          _id: "$product._id",
          productName: "$product.productName",
          image: "$product.image.url",
          totalSold: 1,
          category: "$product.category",
          brand: "$product.brand",
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      topProducts,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch top products",
    });
  }
};

// ==============================
// CUSTOMER GROWTH
// ==============================

export const getCustomerGrowth = async (req, res) => {
  try {
    const customers = await User.aggregate([
      {
        $match: {
          role: "Customer",
        },
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$createdAt",
            },
          },
          customers: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.month": 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      customers,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer growth",
    });
  }
};

// ==============================
// CATEGORY STATS
// ==============================

export const getCategoryStats = async (req, res) => {
  try {
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalProducts: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          totalProducts: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      categoryStats,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch category stats",
    });
  }
};
