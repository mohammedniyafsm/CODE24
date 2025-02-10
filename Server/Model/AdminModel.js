const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Plain text password (for now)
    role: { type: String, default: "admin" },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema);
