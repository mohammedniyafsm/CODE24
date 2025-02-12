const express = require("express");
const {
  signup,
  login,
  verifyOtp,
  getUserDetails,
  getEducatorCourses
} = require("../Controller/EducatorController");
const {
    uploadCourse,
  updateCourse,
  deleteCourse,
  getEducatorCourses: courseControllerGetEducatorCourses,
  getEnrolledStudents,
} = require("../Controller/CourseController");
const { protect, educatorOnly } = require("../Middleware/AuthMiddleware");
const multer = require("multer");
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '../uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)){
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB file size limit
    }
}).array('videos', 10); // Limit to 10 videos

// Wrap multer middleware to handle errors
const uploadMiddleware = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: `Multer error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
};

// 🔹 Educator Authentication Routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

// 🔹 Protected Routes (Educator Only)
router.get("/profile", protect, getUserDetails);
router.get("/courses", protect, educatorOnly, getEducatorCourses);
router.post("/upload-course", 
    protect, 
    educatorOnly,
    uploadMiddleware,
    uploadCourse
);
router.put("/courses/:id", protect, educatorOnly, updateCourse);
router.delete("/courses/:id", protect, educatorOnly, deleteCourse);
router.get("/courses/:id/students", protect, educatorOnly, getEnrolledStudents);

module.exports = router;
