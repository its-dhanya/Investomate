import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaCheckCircle } from "react-icons/fa";

const GoalSetting = () => {
  const navigate = useNavigate();
  const [riskLevel, setRiskLevel] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [goalDuration, setGoalDuration] = useState("");
  const [currentInvestment, setCurrentInvestment] = useState("");
  const [targetGoal, setTargetGoal] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:5001/api/goals";

  // Retrieve JWT token from localStorage
  const token = localStorage.getItem("token");
  console.log("Retrieved token:", token);

  useEffect(() => {
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }
    const fetchGoals = async () => {
      try {
        const response = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Assuming response data is an array of goal objects
        setGoals(response.data);
      } catch (err) {
        console.error("Error fetching goals:", err);
        setError("Failed to fetch goals.");
      }
    };
    fetchGoals();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Ensure risk level is selected
    if (!riskLevel) {
      setError("Please select a risk level.");
      return;
    }

    // Convert and validate numeric inputs
    const mIncome = Number(monthlyIncome);
    const gDuration = Number(goalDuration);
    const cInvestment = Number(currentInvestment);
    const tGoal = Number(targetGoal);

    if (
      isNaN(mIncome) ||
      isNaN(gDuration) ||
      isNaN(cInvestment) ||
      isNaN(tGoal)
    ) {
      setError("Please ensure all numeric fields are valid numbers.");
      return;
    }

    // Ensure numeric values are positive (investment can be 0)
    if (mIncome <= 0 || gDuration <= 0 || cInvestment < 0 || tGoal <= 0) {
      setError("Numeric fields must be greater than 0 (investment can be 0).");
      return;
    }

    const payload = {
      risk_level: riskLevel,
      monthly_income: mIncome,
      goal_duration: gDuration,
      current_investment: cInvestment,
      target_goal: tGoal,
    };

    // Log payload for debugging
    console.log("Payload:", payload);

    try {
      const response = await axios.post(API_URL, payload, {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Goal saved:", response.data);
      setSubmitted(true);
      // Append the newly created goal from the response.
      // The server is expected to return an object with the new goal in a property (e.g. response.data.goal)
      // Adjust based on your server's response structure.
      setGoals([...goals, response.data.goal]);
    } catch (err) {
      console.error("Error saving goal:", err);
      setError(err.response?.data?.error || "Failed to save goal. Try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Set Your Financial Goal
        </h2>
        {error && (
          <p className="text-red-500 text-center mb-2">{error}</p>
        )}
        {submitted ? (
          <div className="text-center">
            <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-2" />
            <h3 className="text-xl font-semibold text-green-600">
              Goal Saved!
            </h3>
            <p className="text-gray-700 mt-2">
              You have set a goal with a <strong>{riskLevel}</strong> risk level, a monthly income of <strong>${monthlyIncome}</strong>, a goal duration of <strong>{goalDuration} years</strong>, a current monthly investment of <strong>${currentInvestment}</strong>, and a target amount of <strong>${targetGoal}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Risk Level
              </label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Risk Level</option>
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Monthly Income ($)
              </label>
              <input
                type="number"
                placeholder="Enter monthly income"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Goal Duration (years)
              </label>
              <input
                type="number"
                placeholder="Enter goal duration in years"
                value={goalDuration}
                onChange={(e) => setGoalDuration(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Current Monthly Investment Amount ($)
              </label>
              <input
                type="number"
                placeholder="Enter current investment amount"
                value={currentInvestment}
                onChange={(e) => setCurrentInvestment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Target Goal Amount ($)
              </label>
              <input
                type="number"
                placeholder="Enter target goal amount"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition font-semibold"
            >
              Save Goal
            </button>
          </form>
        )}
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Your Goals
          </h3>
          {goals.length > 0 ? (
            <ul className="space-y-2">
              {goals.map((goal) => (
                <li
                  key={goal.goalid} 
                  className="p-3 border border-gray-300 rounded-lg bg-gray-50"
                >
                  <strong>Risk Level:</strong> {goal.risk_level} |{" "}
                  <strong>Income:</strong> ${goal.monthly_income} |{" "}
                  <strong>Duration:</strong> {goal.goal_duration} years |{" "}
                  <strong>Investment:</strong> ${goal.current_investment} |{" "}
                  <strong>Target:</strong> ${goal.target_goal}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No goals set yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalSetting;
