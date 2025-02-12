const express = require("express");
const Student = require("../Model/StudentModel");
const {
  signup,
  login,
  verifyOtp,
  getUserDetails,
  updateStudent,
  enrollStudent,
  getEnrolledCourses,
  getEnrolledCourseById,
  getLearningProgress
} = require("../Controller/StudentController");
const {
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
router.put("/profile", protect, updateStudent);
router.get("/courses", getAllCourses);
router.get("/courses/:id", getCourseById);
router.post("/courses/:id/enroll", protect, enrollStudent);
router.get("/enrolled-courses", protect, getEnrolledCourses);
router.get("/enrolled-courses/:courseId", protect, getEnrolledCourseById);
router.get("/learning-progress/:courseId", protect, getLearningProgress);

// Add this route to get student profile
router.get('/me', protect, async (req, res) => {
    try {
        console.log('User ID from token:', req.user._id);

        const student = await Student.findById(req.user._id)
            .select('name email phone createdAt enrolledCourses')
            .populate('enrolledCourses', 'title');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        console.log('Found student:', student);

        res.json({
            success: true,
            student
        });
    } catch (error) {
        console.error('Error in /me route:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

module.exports = router;
