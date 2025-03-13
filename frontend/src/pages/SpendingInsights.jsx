// const SpendingInsights = () => {
//     return (
//       <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
//         <h2 className="text-2xl font-bold text-gray-800 mb-4">Spending Insights</h2>
//         <p className="text-gray-600">Your spending insights will be displayed here.</p>
//         <div className="mt-4">
//           <div className="p-3 mb-2 border rounded-lg bg-gray-50 shadow-sm text-gray-500">
//             Overspending Category
//           </div>
//           <div className="p-3 mb-2 border rounded-lg bg-gray-50 shadow-sm text-gray-500">
//             Monthly Spending Breakdown
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   export default SpendingInsights;
  


// import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

// const data = [
//   { category: "Shopping", amount: 1500 },
//   { category: "Entertainment", amount: 1200 },
//   { category: "Dining", amount: 800 },
//   { category: "Travel", amount: 1000 },
// ];

// const COLORS = ["#FF5733", "#FFC300", "#36A2EB", "#4CAF50"];

// const SpendingInsights = () => {
//   return (
//     <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg">
//       <h2 className="text-3xl font-bold text-gray-800 mb-6">Spending Insights & Overspending Analysis</h2>
//       <p className="text-gray-600 mb-4">Your spending breakdown:</p>

//       <PieChart width={400} height={300}>
//         <Pie data={data} dataKey="amount" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
//           {data.map((_, index) => (
//             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//           ))}
//         </Pie>
//         <Tooltip />
//         <Legend />
//       </PieChart>
//     </div>
//   );
// };

// export default SpendingInsights;

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const SpendingInsights = () => {
  const [spending] = useState([
    { category: "Shopping", amount: 1500, color: "#FF6384" },
    { category: "Entertainment", amount: 1200, color: "#36A2EB" },
    { category: "Dining", amount: 800, color: "#FFCE56" },
    { category: "Transport", amount: 600, color: "#4BC0C0" },
  ]);

  const totalSpending = spending.reduce((acc, item) => acc + item.amount, 0);
  const potentialInvestment = totalSpending * 0.3; // Assume 30% can be saved

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Spending Insights & Investment Impact</h2>

      <div className="flex justify-between items-center">
        <div className="w-1/2">
          <h3 className="text-xl font-semibold mb-3">Overspending Breakdown</h3>
          <PieChart width={300} height={300}>
            <Pie data={spending} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
              {spending.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div className="w-1/2 p-4">
          <h3 className="text-xl font-semibold mb-3">Investment Impact</h3>
          <p className="text-gray-700">
            If you reduce overspending by <span className="text-green-600 font-bold">30%</span>, you could invest
            <span className="text-green-600 font-bold"> ${potentialInvestment}</span> this month.
          </p>
          <p className="mt-2 text-gray-600">
            Potential returns over 5 years: <span className="text-blue-600 font-bold">${(potentialInvestment * 1.5).toFixed(2)}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpendingInsights;
