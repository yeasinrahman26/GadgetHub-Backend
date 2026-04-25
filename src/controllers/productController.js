import Product from "../models/Product.js";

// @desc    Get all products (with search, filter, pagination)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Search by text
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { shortDesc: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by brand
    if (brand) {
      query.brand = { $regex: brand, $options: "i" };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by minimum rating
    if (minRating) {
      query.averageRating = { $gte: Number(minRating) };
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "rating") sortOption = { averageRating: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name")
        .populate("createdBy", "name")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: products,
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

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("createdBy", "name");

    if (!product) {
      res.status(404);
      return next(new Error("Product not found"));
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Mod/Admin
export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populated = await product.populate([
      { path: "category", select: "name" },
      { path: "createdBy", select: "name" },
    ]);

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Mod/Admin
export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      return next(new Error("Product not found"));
    }

    // Mods can only update their own products
    if (
      req.user.role === "mod" &&
      product.createdBy.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      return next(new Error("Mods can only edit their own products"));
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name")
      .populate("createdBy", "name");

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin (or Mod for own products)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      return next(new Error("Product not found"));
    }

    // Mods can only delete their own products
    if (
      req.user.role === "mod" &&
      product.createdBy.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      return next(new Error("Mods can only delete their own products"));
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
export const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      return next(new Error("Product not found"));
    }

    const related = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
    })
      .populate("category", "name")
      .limit(4);

    res.status(200).json({
      success: true,
      data: related,
    });
  } catch (error) {
    next(error);
  }
};
