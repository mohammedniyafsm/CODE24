const express = require("express");
const {
  signup,
  login,
  verifyOtp,
  getUserDetails
} = require("../Controller/EducatorController");
const {
    uploadCourseWithVideos,
  updateCourse,
  deleteCourse,
  getEducatorCourses,
  getEnrolledStudents,
} = require("../Controller/CourseController");
const { protect, educatorOnly } = require("../Middleware/AuthMiddleware");
const uploadMiddleware = require("../Middleware/uploadMiddleware"); // ✅ No need to call as a function


const router = express.Router();

// 🔹 Educator Authentication Routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

// 🔹 Protected Routes (Educator Only)
router.get("/profile", protect, getUserDetails);
router.get("/courses", protect, educatorOnly, getEducatorCourses);
router.post("/upload-course", protect, educatorOnly, uploadMiddleware.array("videos", 5), uploadCourseWithVideos);
router.put("/courses/:id", protect, educatorOnly, updateCourse);
router.delete("/courses/:id", protect, educatorOnly, deleteCourse);
router.get("/courses/:id/students", protect, educatorOnly, getEnrolledStudents);

module.exports = router;
