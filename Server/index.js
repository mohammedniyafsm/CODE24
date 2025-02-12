require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./Config/db");
const studentRoutes = require("./Router/StudentRoute");
const educatorRoutes = require("./Router/EducatorRoute");
const adminRoutes = require("./Router/AdminRoute");
const videoRoutes = require("./Router/VideoRoute");
const chatRoutes = require("./Router/ChatRoute");
const quizRoutes = require("./Router/QuizRoute");


connectDB();

const app = express();

const corsOption = {
  origin: "http://localhost:5174",
  methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOption));

// Add this to check environment variables are loaded
console.log('Environment Check:', {
    nodeEnv: process.env.NODE_ENV,
    cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME)
});

app.get("/", (req, res) => {
  res.status(200).send("Server is running...");
});

app.use("/api/students", studentRoutes);
app.use("/api/educators", educatorRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/quiz", quizRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: err.message
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
