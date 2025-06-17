const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Video = require("../models/Video");
const { error } = require("console");
const jwt = require("jsonwebtoken");


function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // decoded should contain userId or email depending on how you signed it
      next();
  } catch (err) {
      res.status(403).json({ message: "Invalid token" });
  }
}


// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + "-" + file.originalname;
      cb(null, uniqueName);
    },
  });
  
  const upload = multer({ storage });

// Route 1: for upload videos using POST, api/videos/upload
router.post("/upload", upload.single("video"), async (req, res) => {
    console.log("File received:", req.file);
    console.log("Body:", req.body);
    try {
        const { title, description, isPublic } = req.body;

        const video = new Video({
            user: "68469e5f62d4adc1b4e36d0e",
            title,
            description,
            isPublic,
            filePath: req.file.path.replace(/\\/g, "/"),
        });

        await video.save();
        res.status(201).json({ message: "Video uploaded", video });

    } catch (err) {
        res.status(500).json({ message: "Upload failed", error: err.message })
    }
});

// Route 2: Get public video using GET, /api/videos
router.get("/", async (req, res) => {
    try {
        const videos = await Video.find({ isPublic: true }).populate("user", "username").sort({ createdAt: -1 });
        res.json(videos);

    } catch (err) {
        res.status(500).json({ message: "Failed to fetch videos", error: err.message })
    }
});

// Route 3: Get single video using GET, /api/videos/:id
router.get("/:id", async (req, res) => {
    try {
      const video = await Video.findById(req.params.id).populate("user", "username");
  
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      console.log("video =>>>",video);
      
  
      const pathToUse = video.filePath || video.filepath;
  
      if (!pathToUse) {
        return res.status(500).json({ message: "filePath is missing in the video document" });
      }
  
      res.json({
        ...video._doc,
        streamUrl: `${req.protocol}://${req.get("host")}/${pathToUse.replace(/\\/g, "/")}`,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch video", error: err.message });
    }
  });

// Route 4: get current user's videos using GET, /api/videos/user
router.get("/user/me", authenticateToken, async (req, res) => {
  try {
      const videos = await Video.find({ user: req.user.userId }).sort({ createdAt: -1 });
      res.json(videos);

      cons
  } catch (err) {
      res.status(500).json({ message: "Failed to fetch user's videos", error: err.message });
  }
});

// Route 5: Increase the view count using POST, /api/videos/:id/view
router.post("/:id/view", async (req, res) => {
    try {
        await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ message: "View count updated" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update views", error: err.message });
    }
});

module.exports = router;
