const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utilis/cloudinary");

// Cloudinary Storage for multiple videos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "courses_videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "avi", "mkv"],
  },
});

// Create Multer instance
const uploadMiddleware = multer({ storage });

module.exports = uploadMiddleware; // ✅ Export the multer instance directly
