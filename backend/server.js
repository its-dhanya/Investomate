// server.js

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");
require("dotenv").config();

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const tokenHeader = req.header("Authorization");
  if (!tokenHeader) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // If token is prefixed with "Bearer ", remove it.
  const token = tokenHeader.startsWith("Bearer ")
    ? tokenHeader.slice(7, tokenHeader.length)
    : tokenHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Expecting { userid: ... } in the payload
    next();
  } catch (error) {
    return res.status(400).json({ error: "Invalid token." });
  }
};

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// Route to authenticate user and generate a JWT token
app.post("/api/auth", async (req, res) => {
  try {
    const { userid, email, name } = req.body;

    if (!userid || !email || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    // Check if user already exists in the database
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE userid = $1",
      [userid]
    );
    if (existingUser.rows.length === 0) {
      // Insert new user into the database
      await pool.query(
        "INSERT INTO users (userid, name, email) VALUES ($1, $2, $3)",
        [userid, name, email]
      );
    }

    // Generate a JWT token with the user's ID in the payload
    const token = jwt.sign({ userid }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return the token to the frontend
    return res.json({
      success: true,
      message: "User created/exists",
      token,
    });
  } catch (err) {
    console.error("Error storing user:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
});

// Protected route to add a new goal
app.post("/api/goals", verifyToken, async (req, res) => {
  try {
    const { type, amount, priority } = req.body;
    const userid = req.user.userid; // Retrieved from the token

    if (!type || !amount) {
      return res
        .status(400)
        .json({ error: "All fields are required" });
    }

    const result = await pool.query(
      "INSERT INTO goals (userid, type, amount, progress, priority) VALUES ($1, $2, $3, 0, $4) RETURNING *",
      [userid, type, amount, priority || 1]
    );

    return res.json({
      message: "Goal added successfully",
      goal: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving goal:", error);
    return res
      .status(500)
      .json({ error: "Database error" });
  }
});

// Protected route to fetch goals for a user
app.get("/api/goals", verifyToken, async (req, res) => {
  try {
    const userid = req.user.userid;
    const result = await pool.query(
      "SELECT * FROM goals WHERE userid = $1",
      [userid]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return res
      .status(500)
      .json({ error: "Database error" });
  }
});

// Protected route to update a goal's progress
app.put("/api/goals/:goalid", verifyToken, async (req, res) => {
  try {
    const { goalid } = req.params;
    const { progress } = req.body;

    if (progress === undefined) {
      return res
        .status(400)
        .json({ error: "Progress value is required" });
    }

    const result = await pool.query(
      "UPDATE goals SET progress = $1 WHERE goalid = $2 RETURNING *",
      [progress, goalid]
    );

    return res.json({
      message: "Goal updated successfully",
      goal: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating goal:", error);
    return res
      .status(500)
      .json({ error: "Database error" });
  }
});

// Protected route to delete a goal
app.delete("/api/goals/:goalid", verifyToken, async (req, res) => {
  try {
    const { goalid } = req.params;
    await pool.query("DELETE FROM goals WHERE goalid = $1", [goalid]);
    return res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return res
      .status(500)
      .json({ error: "Database error" });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
