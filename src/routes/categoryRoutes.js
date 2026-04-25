import express from "express";
import { body } from "express-validator";
import validate from "../middlewares/validate.js";
import { protect, authorize } from "../middlewares/auth.js";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategory);

router.post(
  "/",
  protect,
  authorize("mod", "admin"),
  [body("name").trim().notEmpty().withMessage("Category name is required")],
  validate,
  createCategory,
);

router.put("/:id", protect, authorize("mod", "admin"), updateCategory);

router.delete("/:id", protect, authorize("admin"), deleteCategory);

export default router;
