const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
  getCategorySummary,
} = require("../controllers/productController");
const { validateObjectId, validateProductBody, validateStockChange } = require("../middleware/validate");

// IMPORTANT: /low-stock aur /summary ko /:id se PEHLE rakho,
// warna Express inhe "id" samajh lega.
router.get("/low-stock", getLowStock);
router.get("/summary", getCategorySummary);

router.route("/").get(getProducts).post(validateProductBody(false), createProduct);

router
  .route("/:id")
  .get(validateObjectId, getProductById)
  .put(validateObjectId, validateProductBody(true), updateProduct)
  .delete(validateObjectId, deleteProduct);

router.patch("/:id/stock", validateObjectId, validateStockChange, adjustStock);

module.exports = router;
