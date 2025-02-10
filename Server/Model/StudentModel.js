const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "student" },
    otp: { type: String }, // Store OTP
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    progress: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        completion: { type: Number, default: 0 }, // 0-100% progress
      }
    ],
  },
  { timestamps: true }
);

// Removed password hashing and comparison logic as bcrypt is not used
module.exports = mongoose.model("Student", StudentSchema);
