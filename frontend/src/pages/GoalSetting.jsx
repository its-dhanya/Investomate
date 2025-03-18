// import { useState } from "react";

// const GoalSetting = () => {
//   const [goalType, setGoalType] = useState("");
//   const [amount, setAmount] = useState("");
//   const [timeframe, setTimeframe] = useState("");
//   const [submitted, setSubmitted] = useState(false);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!goalType || !amount || !timeframe) {
//       alert("Please fill in all fields.");
//       return;
//     }

//     console.log("Goal Submitted:", { goalType, amount, timeframe });
//     setSubmitted(true);
//   };

//   return (
//     <div className="flex justify-center items-center h-screen bg-gray-100">
//       <div className="bg-white p-8 rounded-lg shadow-xl w-96">
//         <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Set Your Goal</h2>

//         {submitted ? (
//           <div className="text-center">
//             <h3 className="text-xl font-semibold text-green-600">Goal Saved!</h3>
//             <p className="text-gray-700 mt-2">You have set a goal for <strong>{goalType}</strong> of <strong>${amount}</strong> in <strong>{timeframe}</strong>.</p>
//           </div>
//         ) : (
//           <form onSubmit={handleSubmit}>
//             <label className="block text-gray-700 font-semibold mb-2">Goal Type</label>
//             <select
//               value={goalType}
//               onChange={(e) => setGoalType(e.target.value)}
//               className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="">Select Goal</option>
//               <option value="Retirement">Retirement</option>
//               <option value="Home Purchase">Home Purchase</option>
//               <option value="Education">Education</option>
//               <option value="Investment Growth">Investment Growth</option>
//             </select>

//             <label className="block text-gray-700 font-semibold mb-2">Target Amount ($)</label>
//             <input
//               type="number"
//               placeholder="Enter amount"
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//             />

//             <label className="block text-gray-700 font-semibold mb-2">Timeframe</label>
//             <input
//               type="text"
//               placeholder="E.g., 5 years"
//               value={timeframe}
//               onChange={(e) => setTimeframe(e.target.value)}
//               className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//             />

//             <button className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition font-semibold">
//               Save Goal
//             </button>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GoalSetting;

/*import { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";

const GoalSetting = () => {
  const [goalType, setGoalType] = useState("");
  const [amount, setAmount] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!goalType || !amount || !timeframe || !reason) {
      alert("Please fill in all fields.");
      return;
    }

    console.log("Goal Submitted:", { goalType, amount, timeframe, reason });
    setSubmitted(true);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Set Your Financial Goal
        </h2>

        {submitted ? (
          <div className="text-center">
            <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-2" />
            <h3 className="text-xl font-semibold text-green-600">Goal Saved!</h3>
            <p className="text-gray-700 mt-2">
              You have set a goal for <strong>{goalType}</strong> of <strong>${amount}</strong> in <strong>{timeframe}</strong> for <strong>{reason}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Goal Type</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Goal</option>
                <option value="Retirement">Retirement</option>
                <option value="Home Purchase">Home Purchase</option>
                <option value="Education">Education</option>
                <option value="Investment Growth">Investment Growth</option>
                <option value="Emergency Fund">Emergency Fund</option>
                <option value="Debt Repayment">Debt Repayment</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Target Amount ($)</label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Timeframe</option>
                <option value="1 Year">1 Year</option>
                <option value="3 Years">3 Years</option>
                <option value="5 Years">5 Years</option>
                <option value="10 Years">10 Years</option>
                <option value="15+ Years">15+ Years</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Reason for Goal</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Reason</option>
                <option value="Financial Stability">Financial Stability</option>
                <option value="Future Security">Future Security</option>
                <option value="Wealth Building">Wealth Building</option>
                <option value="Education Planning">Education Planning</option>
                <option value="Lifestyle Upgrade">Lifestyle Upgrade</option>
                <option value="Debt-Free Life">Debt-Free Life</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition font-semibold"
            >
              Save Goal
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default GoalSetting;*/
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaCheckCircle } from "react-icons/fa";

const GoalSetting = () => {
  const navigate = useNavigate();
  const [goalType, setGoalType] = useState("");
  const [amount, setAmount] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [goals, setGoals] = useState([]); // Store fetched goals
  const [error, setError] = useState("");

  // Replace with your actual backend URL
  const API_URL = "http://localhost:5001/api/goals";
  
  // Retrieve JWT token from localStorage
  const token = localStorage.getItem("token");

  // 🔄 Fetch goals from backend
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGoals(response.data);
      } catch (err) {
        console.error("Error fetching goals:", err);
        setError("Failed to fetch goals.");
      }
    };

    fetchGoals();
  }, [token]);

  // 📌 Submit goal to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!goalType || !amount || !timeframe) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      // Match backend fields (rename goalType -> type)
      const payload = { type: goalType, amount, timeframe };

      const response = await axios.post(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Goal saved:", response.data);
      setSubmitted(true);
      // Update UI with new goal (assuming response.data.goal is returned)
      setGoals([...goals, response.data.goal]);
    } catch (err) {
      console.error("Error saving goal:", err);
      setError("Failed to save goal. Try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Set Your Financial Goal
        </h2>

        {error && <p className="text-red-500 text-center mb-2">{error}</p>}

        {submitted ? (
          <div className="text-center">
            <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-2" />
            <h3 className="text-xl font-semibold text-green-600">Goal Saved!</h3>
            <p className="text-gray-700 mt-2">
              You have set a goal for <strong>{goalType}</strong> of{" "}
              <strong>${amount}</strong> in <strong>{timeframe} years</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Goal Type
              </label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Goal</option>
                <option value="Retirement">Retirement</option>
                <option value="Home Purchase">Home Purchase</option>
                <option value="Education">Education</option>
                <option value="Investment Growth">Investment Growth</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Target Amount ($)
              </label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Timeframe
              </label>
              <input
                type="text"
                placeholder="E.g., 5"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
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

        {/* Display saved goals */}
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
                  <strong>{goal.type}</strong>: ${goal.amount} in {goal.timeframe} years
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
