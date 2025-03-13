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

import { useState } from "react";
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

export default GoalSetting;


