const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

//Router 1: Resistration for new user

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // check if user already exist

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" })
        }

        // Hash the password 
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        // Create a new user 
        const user = new User({ username, email, password: hashedPass });
        await user.save();

        // Genrating token
        const token = jwt.sign(
            {userId: user._id},
            process.env.JWT_SECRET,
            { expiresIn: "1h"}
        )

        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message })
    }
});

//Router 2: Login for user 


router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" }); // 401 for unauthorized
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Create token payload (exclude sensitive data)
        const payload = { 
            userId: user._id,
            email: user.email
        };

        // Verify JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT secret not configured");
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        // Return response (without password)
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ 
            message: "Login failed",
            error: err.message 
        });
    }
});

module.exports = router;