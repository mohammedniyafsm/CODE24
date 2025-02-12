const Admin = require("../Model/AdminModel");
const jwt = require("jsonwebtoken");
const Student = require("../Model/StudentModel");
const Educator = require("../Model/EducatorModel");
const Course = require("../Model/CourseModel");

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

exports.getDashboardStats = async (req, res) => {
    try {
        console.log('Fetching dashboard stats...');

        const totalStudents = await Student.countDocuments();
        const totalEducators = await Educator.countDocuments();
        const totalCourses = await Course.countDocuments();
        const courses = await Course.find().populate('studentsEnrolled');
        
        // Calculate total revenue
        const revenue = courses.reduce((total, course) => {
            return total + (course.price * (course.studentsEnrolled?.length || 0));
        }, 0);

        // Get recent activities
        const recentCourses = await Course.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('educator', 'name');

        const recentStudents = await Student.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email createdAt');

        // Generate sample monthly stats (replace with actual data calculation if available)
        const monthlyStats = [
            { name: 'Jan', students: 40, courses: 24 },
            { name: 'Feb', students: 30, courses: 13 },
            { name: 'Mar', students: 20, courses: 98 },
            { name: 'Apr', students: 27, courses: 39 },
            { name: 'May', students: 18, courses: 48 },
            { name: 'Jun', students: 23, courses: 38 },
        ];

        return res.status(200).json({
            success: true,
            stats: {
                totalStudents,
                totalEducators,
                totalCourses,
                revenue
            },
            recentActivities: {
                courses: recentCourses,
                students: recentStudents
            },
            monthlyStats
        });
    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching dashboard statistics",
            error: error.message
        });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find()
            .select('name email phone enrolledCourses createdAt')
            .populate('enrolledCourses', 'title');

        return res.status(200).json({
            success: true,
            students
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching students"
        });
    }
};

exports.getAllEducators = async (req, res) => {
    try {
        // Add debug logging
        console.log('Starting getAllEducators...');

        const educators = await Educator.find()
            .select('name email phone createdAt courses')
            .populate({
                path: 'courses',
                select: 'title studentsEnrolled price',
                populate: {
                    path: 'studentsEnrolled',
                    select: 'name'
                }
            });

        console.log('Educators found:', educators.length);
        
        if (!educators) {
            return res.status(404).json({
                success: false,
                message: "No educators found"
            });
        }

        // Map the data with null checks
        const mappedEducators = educators.map(educator => {
            return {
                _id: educator._id,
                name: educator.name || 'N/A',
                email: educator.email || 'N/A',
                phone: educator.phone || 'N/A',
                createdAt: educator.createdAt,
                courses: Array.isArray(educator.courses) ? educator.courses.map(course => ({
                    _id: course._id,
                    title: course.title || 'Untitled Course',
                    studentsEnrolled: Array.isArray(course.studentsEnrolled) ? course.studentsEnrolled : [],
                    price: course.price || 0
                })) : []
            };
        });

        console.log('Mapped educators successfully');

        return res.status(200).json({
            success: true,
            educators: mappedEducators
        });

    } catch (error) {
        console.error("Error in getAllEducators:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching educators",
            error: error.message,
            stack: error.stack
        });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const student = await Student.findByIdAndUpdate(id, updateData, { new: true });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
            student
        });
    } catch (error) {
        console.error("Error updating student:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating student"
        });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findByIdAndDelete(id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Student deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting student:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting student"
        });
    }
};

exports.updateEducator = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const educator = await Educator.findByIdAndUpdate(id, updateData, { new: true });
        if (!educator) {
            return res.status(404).json({
                success: false,
                message: "Educator not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Educator updated successfully",
            educator
        });
    } catch (error) {
        console.error("Error updating educator:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating educator"
        });
    }
};

exports.deleteEducator = async (req, res) => {
    try {
        const { id } = req.params;
        const educator = await Educator.findByIdAndDelete(id);
        
        if (!educator) {
            return res.status(404).json({
                success: false,
                message: "Educator not found"
            });
        }

        // Also delete associated courses
        await Course.deleteMany({ educator: id });

        return res.status(200).json({
            success: true,
            message: "Educator and associated courses deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting educator:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting educator"
        });
    }
};

exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('educator', 'name')
            .populate('studentsEnrolled', 'name')
            .select('title price createdAt');

        return res.status(200).json({
            success: true,
            courses
        });
    } catch (error) {
        console.error("Error fetching courses:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching courses"
        });
    }
};
