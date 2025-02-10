const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const EducatorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "educator" },
    otp: { type: String }, // OTP for verification
    coursesCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], // Courses created by educator
  },
  { timestamps: true }
);

// Hash password before saving
EducatorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
EducatorSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Educator", EducatorSchema);
