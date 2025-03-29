// src/App.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [insights, setInsights] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5001/api/insights')
      .then(response => {
        console.log("Insights response:", response.data);
        setInsights(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching insights:', error);
        setLoading(false);
      });
  }, []);

  // Helper function to determine text color & symbol
  const getSentimentStyle = (insight) => {
    const text = insight.toLowerCase();
    if (text.includes("strong buy") || text.includes("buy")) {
      return {
        colorClass: "text-green-700 font-bold",
        symbol: "↑",
      };
    } else if (text.includes("strong sell") || text.includes("sell")) {
      return {
        colorClass: "text-red-700 font-bold",
        symbol: "↓",
      };
    } else if (text.includes("hold")) {
      return {
        colorClass: "text-yellow-600 font-bold",
        symbol: "→",
      };
    } else if (text.includes("cautious")) {
      return {
        colorClass: "text-orange-600 font-semibold",
        symbol: "⚠",
      };
    }
    // Default
    return {
      colorClass: "text-gray-800",
      symbol: "",
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-xl">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 py-8 mb-4">
        <h1 className="text-3xl font-bold text-center text-white">Stock Insights</h1>
        <p className="mt-2 text-center text-white text-lg">
          Below are sentiment-based insights and LSTM predictions for trending stocks
        </p>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {Object.keys(insights).length === 0 ? (
          <div className="text-center text-gray-700">
            No insights available at the moment.
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 border-b text-left text-gray-600">Ticker</th>
                  <th className="py-3 px-4 border-b text-left text-gray-600">Insight</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(insights).map(([ticker, insight], idx) => {
                  const { colorClass, symbol } = getSentimentStyle(insight);
                  return (
                    <tr
                      key={ticker}
                      className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="py-4 px-6 border-b font-semibold text-blue-800">
                        {ticker}
                      </td>
                      <td className={`py-4 px-6 border-b leading-relaxed ${colorClass}`}>
                        {symbol && <span className="mr-2">{symbol}</span>}
                        {insight}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
