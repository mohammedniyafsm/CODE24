const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./Config/db");
const studentRoutes = require("./Router/StudentRoute");
const educatorRoutes = require("./Router/EducatorRoute");
const adminRoutes = require("./Router/AdminRoute");


dotenv.config();
connectDB();

const app = express();

const corsOption = {
  origin: "http://localhost:5174",
  methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOption));

app.get("/", (req, res) => {
  res.status(200).send("Server is running...");
});

app.use("/api/students", studentRoutes);
app.use("/api/educators", educatorRoutes);
app.use("/api/admins", adminRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening at port ${PORT}`);
});
