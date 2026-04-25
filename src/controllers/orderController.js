import Order from "../models/Order.js";
import { v4 as uuidv4 } from "uuid";


// @desc    Create order (User or Guest)
// @route   POST /api/orders
// @access  Public (User or Guest)
export const createOrder = async (req, res, next) => {
  try {
    const { items, totalAmount, shippingAddress, guestInfo } = req.body;

    const orderData = {
      items,
      totalAmount,
      shippingAddress,
      status: "Pending",
    };

    if (req.user) {
      // Logged-in user
      orderData.userId = req.user._id;
    } else {
      // Guest checkout
      if (
        !guestInfo ||
        !guestInfo.name ||
        !guestInfo.email ||
        !guestInfo.phone
      ) {
        res.status(400);
        return next(new Error("Guest info (name, email, phone) is required"));
      }
      orderData.guestId = uuidv4();
      orderData.guestInfo = guestInfo;
    }

    const order = await Order.create(orderData);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders
// @access  Private (User)
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get guest orders by guestId
// @route   GET /api/orders/guest/:guestId
// @access  Public
export const getGuestOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ guestId: req.params.guestId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private (Owner or Admin)
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      return next(new Error("Order not found"));
    }

    // Check ownership
    if (req.user) {
      if (
        req.user.role !== "admin" &&
        order.userId?.toString() !== req.user._id.toString()
      ) {
        res.status(403);
        return next(new Error("Not authorized to view this order"));
      }
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/all
// @access  Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      res.status(400);
      return next(
        new Error(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        ),
      );
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!order) {
      res.status(404);
      return next(new Error("Order not found"));
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
