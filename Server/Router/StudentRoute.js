const express = require("express");
const {
  signup,
  login,
  verifyOtp,
  getUserDetails
} = require("../Controller/StudentController");
const {
    enrollStudent,
    getAllCourses,
    getCourseById,
} = require("../Controller/CourseController");

const { protect } = require("../Middleware/AuthMiddleware");

const router = express.Router();

// 🔹 Student Authentication Routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

// 🔹 Protected Routes (Student Only)
router.get("/profile", protect, getUserDetails);
router.get("/courses", getAllCourses);
router.get("/courses/:id", getCourseById);
router.post("/courses/:id/enroll", protect, enrollStudent);

module.exports = router;
