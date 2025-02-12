const Student = require("../Model/StudentModel"); 
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const randomize = require("randomatic"); 
const { sendOtpEmail } = require("../utilis/nodeMailer"); 
const Course = require("../Model/CourseModel");

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




// ✅ 5. Update Student Data (Protected Route)
exports.updateStudent = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const studentId = req.user.id; // Get user id from the token

    // Validate input data
    if (!name && !email && !phone) {
      return res.status(400).json({ message: 'Please provide at least one field to update' });
    }

    // Find the student by ID
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the student data if the fields are provided in the request
    if (name) student.name = name;
    if (email) student.email = email;
    if (phone) student.phone = phone;

    // Save the updated student data
    await student.save();

    return res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
      },
    });
  } catch (error) {
    console.error('Error updating user details:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user._id; // From auth middleware

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    // Check if student is already enrolled
    if (course.studentsEnrolled.includes(studentId)) {
      return res.status(400).json({ 
        success: false, 
        message: "You are already enrolled in this course" 
      });
    }

    // Add student to course's enrolled students
    course.studentsEnrolled.push(studentId);
    await course.save();

    // Add course to student's enrolled courses (if you have this in Student model)
    const student = await Student.findById(studentId);
    if (student) {
      student.enrolledCourses.push(courseId);
      await student.save();
    }

    return res.status(200).json({
      success: true,
      message: "Successfully enrolled in the course",
      course
    });

  } catch (error) {
    console.error("Error enrolling student:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Error enrolling in course" 
    });
  }
};

// Get enrolled courses for a student with populated course details
exports.getEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Find the student and populate their enrolled courses with full course details
    const student = await Student.findById(studentId)
      .populate({
        path: 'enrolledCourses',
        populate: {
          path: 'educator',
          select: 'name email'
        }
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Get the populated enrolled courses
    const enrolledCourses = student.enrolledCourses;

    return res.status(200).json({
      success: true,
      courses: enrolledCourses,
      message: "Enrolled courses fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching enrolled courses:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching enrolled courses" 
    });
  }
};

// Get a specific enrolled course details
exports.getEnrolledCourseById = async (req, res) => {
  try {
    const studentId = req.user._id;
    const courseId = req.params.courseId;

    // Find the student
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Check if student is enrolled in this course
    if (!student.enrolledCourses.includes(courseId)) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course"
      });
    }

    // Get the course details
    const course = await Course.findById(courseId)
      .populate('educator', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    return res.status(200).json({
      success: true,
      course,
      message: "Course details fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching enrolled course:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching course details" 
    });
  }
};

// Get student's learning progress
exports.getLearningProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const courseId = req.params.courseId;

    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Get progress for specific course or all courses
    const progress = student.progress?.find(p => p.courseId.toString() === courseId);

    return res.status(200).json({
      success: true,
      progress: progress || { completed: [], lastAccessed: null },
      message: "Learning progress fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching learning progress:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching learning progress" 
    });
  }
};


