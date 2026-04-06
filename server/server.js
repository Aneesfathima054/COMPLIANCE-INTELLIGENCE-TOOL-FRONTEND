const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const aiRoutes = require("./ai/routes/aiRoutes");

// Always load environment variables from server/.env even if node is started from repo root.
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// Serve Uploaded Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Atlas Connected");
})
.catch((error) => {
    console.error("Database connection error:", error);
    console.log("Running with in-memory fallback for auth and complaints.");
});


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/ai", aiRoutes);


// Default Route
app.get("/", (req, res) => {
    res.send("Compliance Management System API Running");
});


// Server Port
const PORT = process.env.PORT || 5000;


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});