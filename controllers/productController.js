const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const SORTABLE_FIELDS = ["name", "sku", "category", "price", "quantity", "reorderLevel", "supplier", "createdAt", "updatedAt"];

// Special characters ko escape karta hai taaki regex search safe rahe
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// GET /api/products?category=&supplier=&search=&minPrice=&maxPrice=&inStock=&sort=&page=&limit=
const getProducts = asyncHandler(async (req, res) => {
  const { category, supplier, search, minPrice, maxPrice, inStock, sort, page, limit } = req.query;

  // ---- Filtering ----
  const filter = {};
  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  if (supplier) filter.supplier = new RegExp(escapeRegex(supplier), "i");
  if (search) filter.name = new RegExp(escapeRegex(search), "i");

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) {
      if (Number.isNaN(Number(minPrice))) throw new AppError("minPrice must be a number", 400);
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      if (Number.isNaN(Number(maxPrice))) throw new AppError("maxPrice must be a number", 400);
      filter.price.$lte = Number(maxPrice);
    }
  }
  if (inStock === "true") filter.quantity = { $gt: 0 };
  if (inStock === "false") filter.quantity = 0;

  // ---- Sorting ---- (e.g. sort=-price,name)
  let sortBy = "-createdAt";
  if (sort) {
    const fields = sort
      .split(",")
      .map((f) => f.trim())
      .filter((f) => SORTABLE_FIELDS.includes(f.replace(/^-/, "")));
    if (fields.length) sortBy = fields.join(" ");
  }

  // ---- Pagination ----
  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter).sort(sortBy).skip(skip).limit(limitNum);

  res.json({
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    count: products.length,
    products,
  });
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  res.json(product);
});

// PUT /api/products/:id  (details update)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // updated document return karo
    runValidators: true, // schema validation update pe bhi chalao
  });
  if (!product) throw new AppError("Product not found", 404);
  res.json(product);
});

// PATCH /api/products/:id/stock  body: { "change": 10 } (restock) ya { "change": -5 } (sale)
const adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;
  const filter = { _id: req.params.id };

  // Sale ke time check: stock itna hona chahiye ki negative na ho
  if (change < 0) filter.quantity = { $gte: Math.abs(change) };

  // $inc atomic hai -> do requests ek saath aaye tab bhi stock galat nahi hoga
  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError("Product not found", 404);
    throw new AppError("Insufficient stock for this sale", 400);
  }

  res.json({ message: "Stock updated", product });
});

// DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  res.json({ message: "Product deleted", id: product._id });
});

// GET /api/products/low-stock  (quantity <= reorderLevel) - Aggregation
const getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.aggregate([
    { $match: { $expr: { $lte: ["$quantity", "$reorderLevel"] } } },
    { $sort: { quantity: 1 } },
    {
      $addFields: {
        stockValue: { $multiply: ["$price", "$quantity"] },
        id: { $toString: "$_id" },
      },
    },
  ]);

  res.json({ count: lowStockItems.length, lowStockItems });
});

// GET /api/products/summary  (category-wise report) - Aggregation
const getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalStockValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        avgPrice: { $avg: "$price" },
      },
    },
    {
      $project: {
        totalItems: 1,
        totalQuantity: 1,
        totalStockValue: 1,
        avgPrice: { $round: ["$avgPrice", 2] },
      },
    },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.json({ categories: summary.length, summary });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
  getCategorySummary,
};
