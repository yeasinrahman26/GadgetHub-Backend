import express from "express";
import { body } from "express-validator";
import validate from "../middlewares/validate.js";
import { protect, authorize } from "../middlewares/auth.js";
import {
  getUsers,
  updateUserRole,
  deleteUser,
  getDashboardStats,
} from "../controllers/userController.js";

const router = express.Router();

// All routes require admin access
router.use(protect, authorize("admin"));

router.get("/stats", getDashboardStats);
router.get("/", getUsers);

router.patch(
  "/:id/role",
  [body("role").notEmpty().withMessage("Role is required")],
  validate,
  updateUserRole,
);

router.delete("/:id", deleteUser);

export default router;
