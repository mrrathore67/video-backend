require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const mime = require("mime");
const path = require('path');
const fs = require('fs')

const authRoutes = require("./routes/auth");
// const upload = require("./uploads");
const videoRoutes = require("./routes/videos");



const app = express();

// Middleware
// app.use(cors());
app.use(cors({
    origin: "http://localhost:5173", // or your frontend port
    methods: ["GET", "POST"],
    credentials: true
  }));
app.use(express.json());

app.use("/api/auth", authRoutes);
// app.use("/uploads", express.static("uploads"));
app.get("/uploads/:filename", (req, res) => {
    const filePath = path.join(__dirname, "uploads", req.params.filename);
  
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }
  
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
  
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".ogg": "video/ogg",
    };
  
    const contentType = mimeTypes[ext] || "application/octet-stream";
  
    if (range) {
      // Partial content (video streaming)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  
      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });
  
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
      });
  
      stream.pipe(res);
    } else {
      // Fallback (download the whole file — NOT suitable for streaming)
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      });
  
      fs.createReadStream(filePath).pipe(res);
    }
  });
  
  


app.use("/api/videos", videoRoutes);

const PORT = process.env.PORT || 5000;

// Function for connecting Database  
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
        return true;
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1); 
    }
}

// Test route
app.get("/", (req, res) => {
    res.send("This is video streaming web backend");
});

// Start server only after DB connection
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();