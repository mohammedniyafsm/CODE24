const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    educator: { type: mongoose.Schema.Types.ObjectId, ref: "Educator", required: true }, // Creator of course
    studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }], // Students who enrolled
    category: { type: String, required: true },
    price: { type: Number, default: 0 }, // Free or paid course
    content: [
      {
        type: { type: String, enum: ["video", "text", "quiz"], required: true },
        title: { type: String, required: true },
        url: { type: String }, // Video or text URL
        textContent: { type: String }, // Text content
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
