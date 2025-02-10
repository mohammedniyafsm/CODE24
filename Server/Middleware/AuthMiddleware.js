const jwt = require("jsonwebtoken");
const Student = require("../Model/StudentModel");
const Educator = require("../Model/EducatorModel");

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      req.user = await Student.findById(decoded.id).select("-password") || 
                 await Educator.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

exports.educatorOnly = (req, res, next) => {
  if (req.user && req.user.role === "educator") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Educator only." });
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
  