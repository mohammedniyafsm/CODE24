const Course = require("../Model/CourseModel");
const Student = require("../Model/StudentModel");
const cloudinary = require("../utilis/cloudinary");
const multer = require("multer");
const uploadMiddleware = require("../Middleware/uploadMiddleware"); // ✅ No need to call as a function

// ✅ Course Video Upload Controller
exports.uploadCourseWithVideos = async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No videos uploaded." });
      }
  
      const { title, description, category, price, videoTitles } = req.body;
      const educatorId = req.user._id;
  
      // Parse video titles from frontend (comma-separated)
      const titlesArray = videoTitles.split(",");
  
      if (titlesArray.length !== req.files.length) {
        return res.status(400).json({ message: "Mismatch in number of videos and titles" });
      }
  
      // Map uploaded videos to content array
      const videoContent = req.files.map((file, index) => ({
        type: "video",
        title: titlesArray[index].trim(),
        url: file.path, // Cloudinary URL
      }));
  
      // Create course
      const newCourse = new Course({
        title,
        description,
        category,
        price,
        educator: educatorId,
        content: videoContent,
      });
  
      await newCourse.save();
      return res.status(201).json({ message: "Course created successfully", course: newCourse });
    } catch (error) {
      console.error("Error uploading videos:", error.message);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };
  

// ✅ **2. Get All Courses**
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("educator", "name email");
    return res.status(200).json({ courses });
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ **3. Get a Course by ID**
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("educator", "name email");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json({ course });
  } catch (error) {
    console.error("Error fetching course:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ **4. Enroll Student in Course**
exports.enrollStudent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const student = await Student.findById(req.user._id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (course.studentsEnrolled.includes(student._id)) {
      return res.status(400).json({ message: "You are already enrolled in this course" });
    }

    course.studentsEnrolled.push(student._id);
    await course.save();

    student.enrolledCourses.push(course._id);
    await student.save();

    return res.status(200).json({ message: "Enrolled successfully", course });
  } catch (error) {
    console.error("Error enrolling student:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ **5. Update Course**
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.educator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. You can only update your own courses." });
    }

    const { title, description, category, price, content } = req.body;

    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;
    course.price = price !== undefined ? price : course.price;
    course.content = content || course.content;

    await course.save();
    return res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    console.error("Error updating course:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ **6. Delete Course**
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.educator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. You can only delete your own courses." });
    }

    await course.deleteOne();
    return res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ **7. Get Enrolled Students**
exports.getEnrolledStudents = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("studentsEnrolled", "name email");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.educator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. Only the educator can view enrollments." });
    }

    return res.status(200).json({ students: course.studentsEnrolled });
  } catch (error) {
    console.error("Error fetching enrolled students:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.getEducatorCourses = async (req, res) => {
    try {
      const courses = await Course.find({ educator: req.user._id });
      return res.status(200).json({ courses });
    } catch (error) {
      console.error("Error fetching educator courses:", error.message);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };
  