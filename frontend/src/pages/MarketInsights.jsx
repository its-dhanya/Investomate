import { useState } from "react";

const MarketInsights = () => {
  const [insights] = useState([
    { asset: "Tesla", prediction: "↑ 10% growth expected next month", risk: "Medium" },
    { asset: "Bitcoin", prediction: "↓ 5% dip due to market volatility", risk: "High" },
    { asset: "S&P 500", prediction: "↗️ 7% steady growth projected", risk: "Low" },
  ]);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Market Insights</h2>
      <p className="text-gray-600 mb-4">AI-based predictions for selected investments:</p>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-3 text-left">Asset</th>
            <th className="border p-3 text-left">Prediction</th>
            <th className="border p-3 text-left">Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {insights.map((insight, index) => (
            <tr key={index} className="text-gray-700 border">
              <td className="border p-3">{insight.asset}</td>
              <td className="border p-3">{insight.prediction}</td>
              <td className="border p-3">{insight.risk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarketInsights;
