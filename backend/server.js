const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const { exec } = require("child_process");
require("dotenv").config();

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const tokenHeader = req.header("Authorization");
  if (!tokenHeader) {
    return res
      .status(401)
      .json({ error: "Access denied. No token provided." });
  }
  const token = tokenHeader.startsWith("Bearer ")
    ? tokenHeader.slice(7).trim()
    : tokenHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(400).json({ error: "Invalid token." });
  }
};

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// Authentication Route
app.post("/api/auth", async (req, res) => {
  try {
    const { userid, email, name } = req.body;
    if (!userid || !email || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE userid = $1",
      [userid]
    );
    if (existingUser.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (userid, name, email) VALUES ($1, $2, $3)",
        [userid, name, email]
      );
    }
    const token = jwt.sign({ userid }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
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


app.post("/api/goals", verifyToken, async (req, res) => {
  try {
    const {
      risk_level,
      monthly_income,
      goal_duration,
      current_investment,
      target_goal,
    } = req.body;
    const userid = req.user.userid;
    
    // Validate all required fields are provided
    if (
      !risk_level ||
      !monthly_income ||
      !goal_duration ||
      !current_investment ||
      !target_goal
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Insert new goal into the database using "user_id"
    const result = await pool.query(
      `INSERT INTO goals 
       (user_id, risk_level, monthly_income, goal_duration, current_investment, target_goal)
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        userid,
        risk_level,
        monthly_income,
        goal_duration,
        current_investment,
        target_goal,
      ]
    );
    return res.json({ message: "Goal added successfully", goal: result.rows[0] });
  } catch (error) {
    console.error("Error saving goal:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

// GET goals for a user using the correct column "user_id"
app.get("/api/goals", verifyToken, async (req, res) => {
  try {
    const userid = req.user.userid;
    const result = await pool.query(
      "SELECT * FROM goals WHERE user_id = $1",
      [userid]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

// DELETE a goal
app.delete("/api/goals/:goalid", verifyToken, async (req, res) => {
  try {
    const { goalid } = req.params;
    await pool.query("DELETE FROM goals WHERE goalid = $1", [goalid]);
    return res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

// Investment Simulation Endpoint
app.post("/simulate", (req, res) => {
  const { ticker, years, initialAmount, monthlyContribution } = req.body;
  if (!ticker || !years || !initialAmount || !monthlyContribution) {
    return res.status(400).json({ error: "Missing required parameters" });
  }
  
  // Absolute path for your Python script
  const scriptPath =
    "/Users/dhanyavenkatesh/Investomate/AL/Investment_Simulation.py";
  const command = `python3 "${scriptPath}" --ticker "${ticker}" --years "${years}" --initialAmount "${initialAmount}" --monthlyContribution "${monthlyContribution}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error.message}`);
      return res.status(500).json({
        error: "Internal Server Error",
        details: error.message,
      });
    }
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
      return res.status(500).json({ error: "Script Error", details: stderr });
    }
    
    try {
      const output = JSON.parse(stdout.trim());
      res.json(output);
    } catch (parseError) {
      console.error("JSON Parse Error:", stdout);
      res.status(500).json({
        error: "Invalid JSON output from script",
        details: stdout,
      });
    }
  });
});


app.post("/api/recommendation", async (req, res) => {
  console.log("📩 Received Request Body:", req.body);

  // Accept either a nested structure { goals: { goalid: 1 } } or flat { "goals.goalid": 1 }
  const goalid = (req.body.goals && req.body.goals.goalid) || req.body["goals.goalid"];
  
  if (!goalid) {
    console.error("🚨 Invalid request format: Missing goals.goalid");
    return res.status(400).json({ error: "Missing goals.goalid" });
  }

  try {
    // Select a goal by goalid
    const result = await pool.query(
      "SELECT * FROM goals WHERE goalid = $1 LIMIT 1",
      [goalid]
    );

    console.log("📊 Database Query Result:", result.rows);

    if (result.rows.length === 0) {
      console.error("❌ No goals found for goalid:", goalid);
      return res.status(404).json({ error: "No goals found for this goalid." });
    }

    const goal = result.rows[0];
    const {
      risk_level,
      monthly_income,
      goal_duration,
      current_investment,
      target_goal,
    } = goal;

    console.log("📌 Goal Details:", goal);

    // Dynamically build the command using values from the database
    const command = `/Users/dhanyavenkatesh/Investomate/myenv/bin/python3 ../AL/portfolio.py ` +
      `--risk_level "${risk_level}" ` +
      `--income ${monthly_income} ` +
      `--goal_duration ${goal_duration} ` +
      `--monthly_investment ${current_investment} ` +
      `--target_amount ${target_goal}`;

    console.log("🚀 Executing Python script:", command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Execution error:", error);
        return res.status(500).json({ error: error.message });
      }
      if (stderr) {
        console.error("⚠️ Python script error:", stderr);
        return res.status(500).json({ error: stderr });
      }
      console.log("Raw stdout:", stdout);
      try {
        const output = JSON.parse(stdout.trim());
        console.log("✅ Python Output:", output);
        // Return the recommendations and required_PMT as received
        res.json(output);
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        res.status(500).json({ error: "Failed to parse output from Python script" });
      }
    });
  } catch (dbError) {
    console.error("❌ Database error:", dbError);
    res.status(500).json({ error: "Database error" });
  }
});



const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
