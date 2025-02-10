const express = require("express");
const { signup, login } = require("../Controller/adminController");
const { protect, adminOnly } = require("../Middleware/AuthMiddleware");

const router = express.Router();

// 🔹 Admin Authentication Routes
router.post("/signup", signup);
router.post("/login", login);

// 🔹 Protected Route (Admin Only)
// router.get("/profile", protect, adminOnly, getAdminDetails);

module.exports = router;

