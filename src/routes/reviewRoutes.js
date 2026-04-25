import express from "express";
import { body } from "express-validator";
import validate from "../middlewares/validate.js";
import { protect } from "../middlewares/auth.js";
import {
  getProductReviews,
  createReview,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

router.get("/:productId", getProductReviews);

router.post(
  "/",
  protect,
  [
    body("productId").notEmpty().withMessage("Product ID is required"),
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("Comment is required"),
  ],
  validate,
  createReview,
);

router.delete("/:id", protect, deleteReview);

export default router;
