const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const { spawn, exec } = require("child_process");
const path = require("path");

require("dotenv").config();

const app = express();
app.use("/static", express.static(path.join(__dirname, "static")));
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
    return res.status(401).json({ error: "Access denied. No token provided." });
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
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Shared recommendation logic function
async function getRecommendationForGoal(goal) {
  // Extract required fields from goal
  const { risk_level, monthly_income, goal_duration, current_investment, target_goal } = goal;
  // Use user_id from goal (note: in goals table, it's stored as user_id)
  const user_id = goal.user_id || goal.userid;
  if (!user_id) {
    throw new Error("Invalid goal: missing user identifier");
  }

  // 1. Check if a portfolio record exists for this user.
  let { rows: portfolioRows } = await pool.query(
    "SELECT * FROM portfolios WHERE userid = $1 LIMIT 1",
    [user_id]
  );
  if (portfolioRows.length === 0) {
    // Run portfolio.py if no portfolio record exists.
    const pythonPath = process.env.PYTHON_PATH || "python3";
    const portfolioScript = path.join(__dirname, "..", "AL", "portfolio.py");

    const portfolioCmd = `${pythonPath} "${portfolioScript}" ` +
      `--risk_level "${risk_level}" ` +
      `--income ${monthly_income} ` +
      `--goal_duration ${goal_duration} ` +
      `--monthly_investment ${current_investment} ` +
      `--target_amount ${target_goal}`;

    console.log("🚀 Running portfolio.py:", portfolioCmd);
    
    await new Promise((resolve, reject) => {
      exec(portfolioCmd, async (portErr, portStdout, portStderr) => {
        if (portErr) {
          console.error("❌ Error running portfolio.py:", portErr);
          return reject(portErr);
        }
        if (portStderr) {
          console.error("⚠️ portfolio.py stderr:", portStderr);
        }
        let portfolioResult;
        try {
          portfolioResult = JSON.parse(portStdout.trim());
        } catch (e) {
          console.error("❌ JSON parse error from portfolio.py:", e);
          return reject(new Error("Invalid JSON output from portfolio.py"));
        }
        // Expect portfolioResult to contain { recommendations, required_PMT }
        const { recommendations, required_PMT } = portfolioResult;
        const insertQuery = `
          INSERT INTO portfolios (userid, assets, required_pmt)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        const insertValues = [
          user_id,
          JSON.stringify(recommendations),
          required_PMT
        ];
        try {
          const { rows: insertedPortfolio } = await pool.query(insertQuery, insertValues);
          console.log("✅ Portfolio saved to DB");
          resolve(insertedPortfolio[0]);
        } catch (dbErr) {
          console.error("❌ DB insertion error for portfolio:", dbErr);
          return reject(dbErr);
        }
      });
    });
    
    // Re-read the portfolio record after insertion.
    const portfolioData = await pool.query(
      "SELECT * FROM portfolios WHERE userid = $1 LIMIT 1",
      [user_id]
    );
    portfolioRows = portfolioData.rows;
  } else {
    console.log("✅ Portfolio exists in DB.");
  }
  
  const portfolioRecord = portfolioRows[0];
  if (!portfolioRecord.portfolio_id) {
    throw new Error("Internal server error: portfolio record missing portfolio_id.");
  }
  const portfolio_id = portfolioRecord.portfolio_id;

  // 2. Check if a risk analysis record exists for this portfolio.
  let { rows: analysisRows } = await pool.query(
    "SELECT * FROM portfolio_analysis WHERE portfolio_id = $1 LIMIT 1",
    [portfolio_id]
  );
  if (analysisRows.length === 0) {
    // Use stored portfolio assets for risk analysis.
    const portfolioAssets = portfolioRecord.assets;
    const pythonPath = process.env.PYTHON_PATH || "python3";
    // Absolute path for modified_spa.py.
    const riskScript = "/Users/dhanyavenkatesh/Investomate/AL/modified_spa.py";
    const riskCmd = `${pythonPath} "${riskScript}" '${JSON.stringify(portfolioAssets)}'`;
    console.log("🚀 Running modified_spa.py:", riskCmd);
    
    await new Promise((resolve, reject) => {
      exec(riskCmd, async (riskErr, riskStdout, riskStderr) => {
        if (riskErr) {
          console.error("❌ Error running modified_spa.py:", riskErr);
          return reject(riskErr);
        }
        if (riskStderr) {
          console.error("⚠️ modified_spa.py stderr:", riskStderr);
        }
        let riskResult;
        try {
          riskResult = JSON.parse(riskStdout.trim());
        } catch (e) {
          console.error("❌ JSON parse error from modified_spa.py:", e);
          return reject(new Error("Invalid JSON output from modified_spa.py"));
        }
        const insertQuery = `
          INSERT INTO portfolio_analysis (portfolio_id, analysis)
          VALUES ($1, $2)
          RETURNING *
        `;
        const insertValues = [ 
          portfolio_id, 
          JSON.stringify(riskResult) 
        ];
        try {
          const { rows: insertedAnalysis } = await pool.query(insertQuery, insertValues);
          console.log("✅ Risk analysis saved to DB");
          resolve(insertedAnalysis[0]);
        } catch (dbErr) {
          console.error("❌ DB insertion error for risk analysis:", dbErr);
          return reject(dbErr);
        }
      });
    });
  } else {
    console.log("✅ Risk analysis exists in DB.");
  }

  // 3. Retrieve final stored results.
  const { rows: finalPortfolio } = await pool.query(
    "SELECT * FROM portfolios WHERE userid = $1 LIMIT 1",
    [user_id]
  );
  const { rows: finalAnalysis } = await pool.query(
    "SELECT * FROM portfolio_analysis WHERE portfolio_id = $1 LIMIT 1",
    [portfolio_id]
  );
  const recommendationsData =
    typeof finalPortfolio[0].assets === "string"
      ? JSON.parse(finalPortfolio[0].assets)
      : finalPortfolio[0].assets || [];
  const requiredPMT = finalPortfolio[0].required_pmt;
  let analysisData = {};
  if (finalAnalysis.length > 0 && finalAnalysis[0].analysis !== undefined && finalAnalysis[0].analysis !== null) {
    analysisData =
      typeof finalAnalysis[0].analysis === "string"
        ? JSON.parse(finalAnalysis[0].analysis)
        : finalAnalysis[0].analysis;
  } else {
    console.warn("⚠️ No risk analysis record found for portfolio_id:", portfolio_id);
  }

  return {
    recommendations: recommendationsData,
    required_PMT: requiredPMT,
    analysis: analysisData,
  };
}

// /api/recommendation endpoint using shared recommendation function
app.post("/api/recommendation", async (req, res) => {
  console.log("📩 Received Request Body:", req.body);
  // Accept either a nested structure { goals: { goalid: 1 } } or flat { "goals.goalid": 1 }
  const goalid = (req.body.goals && req.body.goals.goalid) || req.body["goals.goalid"];
  if (!goalid) {
    console.error("🚨 Missing goals.goalid");
    return res.status(400).json({ error: "Missing goals.goalid" });
  }
  try {
    const { rows: goalRows } = await pool.query(
      "SELECT * FROM goals WHERE goalid = $1 LIMIT 1",
      [goalid]
    );
    if (goalRows.length === 0) {
      return res.status(404).json({ error: "Goal not found" });
    }
    const goal = goalRows[0];
    const recommendationData = await getRecommendationForGoal(goal);
    return res.status(201).json(recommendationData);
  } catch (err) {
    console.error("Server error in recommendation:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// /api/goals endpoint calls recommendation logic after goal creation
app.post("/api/goals", verifyToken, async (req, res) => {
  try {
    const { risk_level, monthly_income, goal_duration, current_investment, target_goal } = req.body;
    const userid = req.user.userid;
    if (!risk_level || !monthly_income || !goal_duration || !current_investment || !target_goal) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const result = await pool.query(
      `INSERT INTO goals 
       (user_id, risk_level, monthly_income, goal_duration, current_investment, target_goal)
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userid, risk_level, monthly_income, goal_duration, current_investment, target_goal]
    );
    const newGoal = result.rows[0];

    // Automatically invoke recommendation logic after inserting goal.
    const recommendationData = await getRecommendationForGoal(newGoal);

    return res.json({
      message: "Goal added successfully",
      goal: newGoal,
      recommendation: recommendationData,
    });
  } catch (error) {
    console.error("Error saving goal:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/goals", verifyToken, async (req, res) => {
  try {
    const userid = req.user.userid;
    const result = await pool.query("SELECT * FROM goals WHERE user_id = $1", [userid]);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

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

app.post("/simulate", (req, res) => {
  const { ticker, years, initialAmount, monthlyContribution } = req.body;
  if (!ticker || !years || !initialAmount || !monthlyContribution) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const scriptPath = "/Users/dhanyavenkatesh/Investomate/AL/Investment_Simulation.py";
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

app.get("/api/insights", (req, res) => {
  const pythonProcess = spawn("python3", ["../AL/insights.py"]);
  let dataToSend = "";
  pythonProcess.stdout.on("data", (data) => {
    dataToSend += data.toString();
  });
  pythonProcess.stdout.on("end", () => {
    try {
      const insights = JSON.parse(dataToSend);
      res.json(insights);
    } catch (error) {
      console.error("Error parsing JSON from Python:", error);
      res.status(500).json({ error: "Error parsing Python output" });
    }
  });
  pythonProcess.stderr.on("data", (data) => {
    console.error("Python error:", data.toString());
  });
});

app.post("/api/optimize-spending", (req, res) => {
  const inputJson = JSON.stringify(req.body);
  const scriptPath = path.join(__dirname, "..", "AL", "spending_analysis.py");
  exec(`python3 "${scriptPath}" '${inputJson}'`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
    }
    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch (parseError) {
      console.error(`Error parsing JSON output: ${parseError.message}`);
      res.status(500).json({ error: "Error parsing JSON output from Python script" });
    }
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));