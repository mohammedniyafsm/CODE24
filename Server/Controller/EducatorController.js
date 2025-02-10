const Educator = require("../Model/EducatorModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const randomize = require("randomatic");
const { sendOtpEmail } = require("../utilis/nodeMailer");

// ✅ Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: "30d" });
};

// ✅ 1. Educator Signup with OTP
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("Signup email:", email); // Debug log

    const emailExist = await Educator.findOne({ email });
    if (emailExist) {
      return res.status(400).json({ message: "Email already exists. Please login." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = randomize("0", 6); // Generate 6-digit OTP

    const newEducator = new Educator({ name, email, password: hashedPassword, otp });
    await newEducator.save();

    // Send OTP to email
    const emailResponse = await sendOtpEmail(email, otp);
    console.log("Email Response:", emailResponse);

    return res.status(200).json({ message: "Signup successful. Verify your email using the OTP sent." });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).send("Server error");
  }
};

// ✅ 2. Educator Login with OTP
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("Login email:", email); // Debug log

    const educator = await Educator.findOne({ email });
    if (!educator) {
      return res.status(404).json({ message: "User not found. Please sign up." });
    }

    const isMatch = await bcrypt.compare(password, educator.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const otp = randomize("0", 6); // Generate 6-digit OTP
    educator.otp = otp;
    await educator.save();

    // Send OTP to email
    const emailResponse = await sendOtpEmail(email, otp);
    console.log("Email Response:", emailResponse);

    return res.status(200).json({ message: "OTP sent to your email. Verify to continue." });
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

    const educator = await Educator.findOne({ email, otp });
    if (!educator) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    educator.otp = ""; // Clear OTP after successful verification
    await educator.save();

    const token = generateToken(educator._id);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      token,
      user: {
        id: educator._id,
        name: educator.name,
        email: educator.email,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error.message);
    return res.status(500).json({ success: false, message: "An error occurred during OTP verification" });
  }
};

// ✅ 4. Get Educator Details (Protected Route)
exports.getUserDetails = async (req, res) => {
  try {
    const educator = await Educator.findById(req.user.id).select("-password");

    if (!educator) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User details fetched successfully",
      user: educator,
    });
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
