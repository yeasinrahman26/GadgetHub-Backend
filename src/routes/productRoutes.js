import express from "express";
import { body } from "express-validator";
import validate from "../middlewares/validate.js";
import { protect, authorize } from "../middlewares/auth.js";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProduct);
router.get("/:id/related", getRelatedProducts);

router.post(
  "/",
  protect,
  authorize("mod", "admin"),
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("shortDesc")
      .trim()
      .notEmpty()
      .withMessage("Short description is required"),
    body("fullDesc")
      .trim()
      .notEmpty()
      .withMessage("Full description is required"),
    body("price").isNumeric().withMessage("Valid price is required"),
    body("images")
      .isArray({ min: 1 })
      .withMessage("At least one image is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("brand").trim().notEmpty().withMessage("Brand is required"),
    body("stock").isNumeric().withMessage("Valid stock number is required"),
  ],
  validate,
  createProduct,
);

router.put("/:id", protect, authorize("mod", "admin"), updateProduct);

router.delete("/:id", protect, authorize("mod", "admin"), deleteProduct);

export default router;
