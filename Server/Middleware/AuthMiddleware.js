const jwt = require("jsonwebtoken");
const Student = require("../Model/StudentModel");
const Educator = require("../Model/EducatorModel");

exports.protect = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized to access this route"
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log('Decoded token:', decoded); // Add for debugging

        // Try to find user in both Student and Educator models
        const user = await Student.findById(decoded.id) || await Educator.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Add user type to request
        req.userType = user.constructor.modelName.toLowerCase();
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: "Not authorized to access this route",
            error: error.message
        });
    }
};

exports.educatorOnly = async (req, res, next) => {
    if (req.userType === 'educator') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied. Educator only."
        });
    }
};

// 🔹 Admin Only Middleware
exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
  };
  