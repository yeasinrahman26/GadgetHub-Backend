import Review from "../models/Review.js";
import Product from "../models/Product.js";

// Helper: Recalculate product rating
const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId: productId } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private (User)
export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      return next(new Error("Product not found"));
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId,
      userId: req.user._id,
    });

    if (existingReview) {
      res.status(400);
      return next(new Error("You have already reviewed this product"));
    }

    const review = await Review.create({
      productId,
      userId: req.user._id,
      rating,
      comment,
    });

    // Update product average rating
    await updateProductRating(product._id);

    const populated = await review.populate("userId", "name avatar");

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Owner or Admin)
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      return next(new Error("Review not found"));
    }

    // Only owner or admin can delete
    if (
      req.user.role !== "admin" &&
      review.userId.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      return next(new Error("Not authorized to delete this review"));
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate product rating
    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
