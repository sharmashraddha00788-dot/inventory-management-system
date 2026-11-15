// Run: npm run seed  -> database me 12 sample products daal deta hai (purana data delete hoga)
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
  { name: "Wireless Mouse", sku: "ELEC-MS-101", category: "Electronics", price: 799, quantity: 25, reorderLevel: 10, supplier: "Logitech India" },
  { name: "Bluetooth Speaker", sku: "ELEC-SP-102", category: "Electronics", price: 2499, quantity: 8, reorderLevel: 10, supplier: "boAt" },
  { name: "Laptop 15 inch", sku: "ELEC-LP-103", category: "Electronics", price: 45999, quantity: 5, reorderLevel: 3, supplier: "Lenovo India" },
  { name: "Smartphone X", sku: "ELEC-PH-104", category: "Electronics", price: 18999, quantity: 4, reorderLevel: 5, supplier: "Samsung India" },
  { name: "Cotton T-Shirt", sku: "APRL-TS-201", category: "Apparel", price: 499, quantity: 60, reorderLevel: 20, supplier: "Allen Solly" },
  { name: "Denim Jeans", sku: "APRL-JN-202", category: "Apparel", price: 2299, quantity: 18, reorderLevel: 15, supplier: "Levis India" },
  { name: "Study Table", sku: "FURN-TB-812", category: "Furniture", price: 3999, quantity: 2, reorderLevel: 4, supplier: "IKEA India" },
  { name: "Office Chair", sku: "FURN-CH-813", category: "Furniture", price: 5499, quantity: 12, reorderLevel: 5, supplier: "Godrej Interio" },
  { name: "Gel Pen Pack of 15", sku: "STNY-PN-713", category: "Stationery", price: 120, quantity: 40, reorderLevel: 20, supplier: "Cello Pens" },
  { name: "Spiral Notebook", sku: "STNY-NB-714", category: "Stationery", price: 60, quantity: 15, reorderLevel: 25, supplier: "Classmate" },
  { name: "Basmati Rice 5kg", sku: "GROC-RC-901", category: "Groceries", price: 650, quantity: 30, reorderLevel: 10, supplier: "India Gate" },
  { name: "Olive Oil 1L", sku: "GROC-OL-902", category: "Groceries", price: 899, quantity: 20, reorderLevel: 8, supplier: "Figaro" },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
  } catch (err) {
    console.error(err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
