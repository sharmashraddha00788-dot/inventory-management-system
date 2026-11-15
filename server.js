require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Middleware: JSON body ko parse karta hai
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Inventory Management API is running" });
});

// Routes
app.use("/api/products", productRoutes);

// 404 + centralized error handler (hamesha last me)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
