const express = require("express");
const cors = require("cors");
const pool = require("./db"); 

require("dotenv").config();

const app = express();
app.use(cors()); 
app.use(express.json()); 


app.get("/", (req, res) => {
    res.send("Backend is running...");
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



app.post("/api/goals", async (req, res) => {
    try {
        const { user_id, category, amount } = req.body;  

        if (!user_id || !category || !amount) {
            return res.status(400).json({ error: "All fields are required" });
        }

        
        const result = await pool.query(
            "INSERT INTO goals (user_id, category, amount) VALUES ($1, $2, $3) RETURNING *",
            [user_id, category, amount]
        );

        res.json({ message: "Goal added successfully", goal: result.rows[0] });
    } catch (error) {
        console.error("Error saving goal:", error);
        res.status(500).json({ error: "Database error" });
    }
});

