// const InvestmentSuggestions = () => {
//     return (
//       <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
//         <h2 className="text-2xl font-bold text-gray-800 mb-4">Investment Suggestions</h2>
//         <p className="text-gray-600">Smart investment recommendations will appear here.</p>
//         <div className="grid grid-cols-2 gap-4 mt-4">
//           <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
//             High-Yield Savings
//           </div>
//           <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
//             Diversified Stocks
//           </div>
//           <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
//             Cryptocurrency Options
//           </div>
//           <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
//             Low-Risk Bonds
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   export default InvestmentSuggestions;
  

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { category: "Savings", amount: 3000 },
  { category: "Stocks", amount: 5000 },
  { category: "Real Estate", amount: 7000 },
  { category: "Education", amount: 2000 },
];

const InvestmentSuggestions = () => {
  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Smart Investment Suggestions</h2>
      <p className="text-gray-600 mb-4">Recommended investments based on your spending:</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InvestmentSuggestions;


