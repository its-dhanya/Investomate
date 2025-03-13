// const Portfolio = () => {
//     return (
//       <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
//         <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Portfolio</h2>
//         <p className="text-gray-600">Your investments will be displayed here.</p>
//         <div className="grid grid-cols-2 gap-4 mt-4">
//           <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
//             Stock Investments
//           </div>
//           <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
//             Crypto Holdings
//           </div>
//           <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
//             Mutual Funds
//           </div>
//           <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
//             Bonds
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   export default Portfolio;
import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const Portfolio = () => {
  const [investments, setInvestments] = useState([
    { type: "Stocks", name: "Tesla", amount: 5000, returns: "12%" },
    { type: "Crypto", name: "Bitcoin", amount: 2000, returns: "18%" },
    { type: "Mutual Funds", name: "S&P 500 Index", amount: 3000, returns: "10%" },
    { type: "Bonds", name: "Govt Bond", amount: 1500, returns: "5%" },
  ]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Investment Portfolio</h2>

      <div className="flex flex-col md:flex-row items-center">
        <table className="w-full md:w-1/2 border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Investment Type</th>
              <th className="border p-3 text-left">Name</th>
              <th className="border p-3 text-left">Amount ($)</th>
              <th className="border p-3 text-left">Returns</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((inv, index) => (
              <tr key={index} className="text-gray-700 border">
                <td className="border p-3">{inv.type}</td>
                <td className="border p-3">{inv.name}</td>
                <td className="border p-3">${inv.amount}</td>
                <td className="border p-3">{inv.returns}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <PieChart width={300} height={300} className="mt-6 md:mt-0 md:ml-8">
          <Pie
            data={investments}
            dataKey="amount"
            nameKey="type"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {investments.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  );
};

export default Portfolio;

