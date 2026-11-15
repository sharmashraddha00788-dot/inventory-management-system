const mongoose = require("mongoose");

const ALLOWED_FIELDS = ["name", "sku", "category", "price", "quantity", "reorderLevel", "supplier"];
const REQUIRED_ON_CREATE = ["name", "sku", "category", "price"];

// Check karta hai ki URL ka :id valid MongoDB ObjectId hai ya nahi
const validateObjectId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid product id" });
  }
  next();
};

// isUpdate=false -> create, isUpdate=true -> update (partial allowed)
const validateProductBody = (isUpdate = false) => (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  // Sirf allowed fields rakho (_id, createdAt waghera ignore)
  const clean = {};
  ALLOWED_FIELDS.forEach((f) => {
    if (body[f] !== undefined) clean[f] = body[f];
  });

  if (isUpdate && Object.keys(clean).length === 0) {
    errors.push("Provide at least one valid field to update");
  }

  if (!isUpdate) {
    REQUIRED_ON_CREATE.forEach((f) => {
      if (clean[f] === undefined || clean[f] === "") errors.push(`${f} is required`);
    });
  }

  ["name", "sku", "category", "supplier"].forEach((f) => {
    if (clean[f] !== undefined && typeof clean[f] !== "string") errors.push(`${f} must be a string`);
  });

  ["price", "quantity", "reorderLevel"].forEach((f) => {
    if (clean[f] !== undefined && (typeof clean[f] !== "number" || Number.isNaN(clean[f]) || clean[f] < 0)) {
      errors.push(`${f} must be a non-negative number`);
    }
  });

  if (clean.quantity !== undefined && typeof clean.quantity === "number" && !Number.isInteger(clean.quantity)) {
    errors.push("quantity must be a whole number");
  }

  if (errors.length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  if (clean.sku) clean.sku = clean.sku.trim().toUpperCase();
  req.body = clean;
  next();
};

// PATCH /:id/stock ke liye: { "change": 10 } ya { "change": -5 }
const validateStockChange = (req, res, next) => {
  const { change } = req.body || {};
  if (typeof change !== "number" || !Number.isInteger(change) || change === 0) {
    return res.status(400).json({
      message: "'change' must be a non-zero whole number (positive = restock, negative = sale)",
    });
  }
  next();
};

module.exports = { validateObjectId, validateProductBody, validateStockChange };
