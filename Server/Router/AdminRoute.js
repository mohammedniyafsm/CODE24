const express = require("express");
const router = express.Router();
const {
    getDashboardStats,
    getAllStudents,
    getAllEducators,
    getAllCourses
} = require("../Controller/AdminController");

// Remove protect and adminOnly middleware
router.get("/dashboard", getDashboardStats);
router.get("/students", getAllStudents);
router.get("/educators", getAllEducators);
router.get("/courses", getAllCourses);

module.exports = router;

