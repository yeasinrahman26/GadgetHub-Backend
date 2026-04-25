import express from "express";
import { body } from "express-validator";
import validate from "../middlewares/validate.js";
import { protect, authorize, optionalAuth } from "../middlewares/auth.js";
import {
  createOrder,
  getMyOrders,
  getGuestOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

// Create order - accessible to both logged-in users and guests
router.post(
  "/",
  optionalAuth,
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("At least one item is required"),
    body("totalAmount").isNumeric().withMessage("Total amount is required"),
    body("shippingAddress.street").notEmpty().withMessage("Street is required"),
    body("shippingAddress.city").notEmpty().withMessage("City is required"),
    body("shippingAddress.zip").notEmpty().withMessage("ZIP code is required"),
    body("shippingAddress.country")
      .notEmpty()
      .withMessage("Country is required"),
  ],
  validate,
  createOrder,
);

// Admin: Get all orders (must be before /:id to avoid conflict)
router.get("/all", protect, authorize("admin"), getAllOrders);

// Guest: Track orders by guestId
router.get("/guest/:guestId", getGuestOrders);

// User: Get own orders
router.get("/", protect, getMyOrders);

// Get single order
router.get("/:id", protect, getOrder);

// Admin: Update order status
router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  [body("status").notEmpty().withMessage("Status is required")],
  validate,
  updateOrderStatus,
);

export default router;
