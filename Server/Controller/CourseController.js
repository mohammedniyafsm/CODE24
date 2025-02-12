const Course = require("../Model/CourseModel");
const Student = require("../Model/StudentModel");
const { uploadVideo } = require('../utilis/cloudinary');
const multer = require("multer");
const uploadMiddleware = require("../Middleware/uploadMiddleware"); // ✅ No need to call as a function
const fs = require('fs');
const path = require('path');

// ✅ Course Video Upload Controller
exports.uploadCourse = async (req, res) => {
    try {
        // Debug logs
        console.log('Starting course upload...');
        console.log('Request user:', req.user);
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)){
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload at least one video"
            });
        }

        const { title, description, category, price, videoTitles } = req.body;
        
        // Validate required fields
        if (!title || !description || !category || !price) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const educatorId = req.user._id;
        console.log('Educator ID:', educatorId);

        // Split video titles and validate
        const titleArray = videoTitles ? videoTitles.split(',') : [];
        console.log('Video titles:', titleArray);
        
        if (titleArray.length !== req.files.length) {
            return res.status(400).json({
                success: false,
                message: "Number of titles doesn't match number of videos"
            });
        }

        // Upload videos to cloudinary
        console.log('Starting video uploads to Cloudinary...');
        const videoPromises = req.files.map(async (file, index) => {
            try {
                console.log(`Uploading file ${index + 1}:`, file.path);
                const result = await uploadVideo(file.path);
                console.log(`Upload result for file ${index + 1}:`, result);

                // Delete the file from local storage after upload
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                    console.log(`Deleted local file: ${file.path}`);
                }

                return {
                    type: "video",
                    title: titleArray[index].trim(),
                    url: result.secure_url,
                    public_id: result.public_id
                };
            } catch (error) {
                console.error(`Error uploading video ${index + 1}:`, error);
                // Clean up the file if upload fails
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
                throw new Error(`Failed to upload video ${index + 1}: ${error.message}`);
            }
        });

        console.log('Waiting for all video uploads to complete...');
        const uploadedVideos = await Promise.all(videoPromises);
        console.log('All videos uploaded successfully:', uploadedVideos);

        // Create new course
        console.log('Creating new course...');
        const newCourse = new Course({
            title,
            description,
            category,
            price: Number(price),
            educator: educatorId,
            content: uploadedVideos,
            studentsEnrolled: []
        });

        console.log('Saving course to database...');
        await newCourse.save();
        console.log('Course saved successfully:', newCourse);

        return res.status(201).json({
            success: true,
            message: "Course uploaded successfully",
            course: newCourse
        });

    } catch (error) {
        console.error("Error in uploadCourse:", error);
        
        // Clean up any remaining files
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                    console.log(`Cleaned up file: ${file.path}`);
                }
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Error uploading course",
            error: error.stack // Include stack trace for debugging
        });
    }
};

// ✅ **2. Get All Courses**
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('educator', 'name email')
      .select('title description price content educator createdAt category');

    if (!courses) {
      return res.status(404).json({
        success: false,
        message: "No courses found"
      });
    }

    console.log("Fetched courses:", courses); // For debugging

    return res.status(200).json({
      success: true,
      courses: courses,
      message: "Courses fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Error fetching courses" 
    });
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
  