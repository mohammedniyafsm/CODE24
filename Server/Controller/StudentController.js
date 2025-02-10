const Student = require("../Model/StudentModel"); 
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const randomize = require("randomatic"); 
const { sendOtpEmail } = require("../utilis/nodeMailer"); 

// ✅ Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: "30d" });
};

// ✅ 1. Student Signup with OTP
// ✅ 1. Student Signup with OTP
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailExist = await Student.findOne({ email });
    if (emailExist) {
      return res.status(400).json({ message: "Email already exists. Please login." });
    }

    const otp = randomize("0", 6); // Generate 6-digit OTP

    const newStudent = new Student({ name, email, password, otp });
    await newStudent.save();

    // Send OTP to email
    const emailResponse = await sendOtpEmail(email, otp);
    console.log("Email Response:", emailResponse);

    return res.status(200).json({
      success: true,
      message: "Account created successfully! OTP sent to your email. Verify to continue.",
      status: true, // Explicit status flag for frontend
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).send("Server error");
  }
};



// ✅ 2. Student Login with OTP
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(404).json({ message: "User not found. Please sign up." });
    }

    // Directly compare plain password (you can replace this with a custom comparison logic)
    if (student.password !== password) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const otp = randomize("0", 6); // Generate 6-digit OTP
    student.otp = otp;
    await student.save();

    // Send OTP to email
    const emailResponse = await sendOtpEmail(email, otp);
    console.log("Email Response:", emailResponse);

    return res.status(200).json({
      message: "OTP sent to your email. Verify to continue.",
      status: true,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ error: "Internal error" });
  }
};



// ✅ 3. Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const student = await Student.findOne({ email, otp });
    if (!student) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    student.otp = ""; // Clear OTP after successful verification
    await student.save();

    const token = generateToken(student._id);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error.message);
    return res.status(500).json({ success: false, message: "An error occurred during OTP verification" });
  }
};

// ✅ 4. Get Student Details (Protected Route)
exports.getUserDetails = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-password");

    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User details fetched successfully",
      user: student,
    });
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

