const Admin = require("../Model/AdminModel");
const jwt = require("jsonwebtoken");

// ✅ Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET_KEY, { expiresIn: "30d" });
};

// ✅ 1. Admin Signup (No Bcrypt)
exports.signup = async (req, res) => {
  try {
    const { name, email, password, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const emailExist = await Admin.findOne({ email });
    if (emailExist) return res.status(400).json({ message: "Email already exists. Please login." });

    const newAdmin = new Admin({ name, email, password, permissions });
    await newAdmin.save();

    return res.status(201).json({ message: "Admin account created successfully." });
  } catch (error) {
    console.error("Admin signup error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ 2. Admin Login (No Bcrypt)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Compare plain text passwords
    if (admin.password !== password) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const token = generateToken(admin._id);

    return res.status(200).json({
      message: "Admin login successful.",
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
