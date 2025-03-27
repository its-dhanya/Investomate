import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PortfolioPieChart = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [requiredPMT, setRequiredPMT] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Function to fetch recommendation from backend API
  const fetchRecommendation = async () => {
    setLoading(true);
    setError("");
    try {
      // Adjust the payload as needed; here we use a dummy goalid.
      const response = await axios.post("http://localhost:5001/api/recommendation", {
        "goals.goalid": 1,
      });

      if (response.data && response.data.recommendations) {
        setRecommendations(response.data.recommendations);
        setRequiredPMT(response.data.required_PMT);
      } else {
        setRecommendations([]);
        setError("No recommendation data received.");
      }
    } catch (err) {
      console.error("Error fetching recommendation:", err);
      setError(err.response?.data?.error || "An error occurred while fetching recommendations.");
      setRecommendations([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecommendation();
  }, []);

  // Generate colors dynamically
  const getColors = (numColors) => {
    const baseColors = [
      "#EF4444", "#3B82F6", "#F59E0B", "#10B981",
      "#8B5CF6", "#F97316", "#22D3EE", "#14B8A6",
      "#F43F5E", "#A3E635"
    ];
    return baseColors.slice(0, numColors);
  };

  // Prepare data for the Pie Chart
  const pieData = recommendations.length > 0 ? {
    labels: recommendations.map((rec) => rec.ticker),
    datasets: [
      {
        label: "Stock Allocation (%)",
        data: recommendations.map((rec) => rec.weight), // weight is already in percentage
        backgroundColor: getColors(recommendations.length),
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Portfolio Allocation</h2>
      {loading ? (
        <p className="text-lg text-gray-600">Loading portfolio recommendation...</p>
      ) : error ? (
        <p className="text-lg text-red-500">{error}</p>
      ) : (
        recommendations.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="w-full max-w-md mx-auto mb-6">
              {pieData && <Pie data={pieData} />}
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-blue-600">
                Required Monthly Investment: ${requiredPMT.toFixed(2)}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <h4 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-4">
                Recommendations Details
              </h4>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2">Ticker</th>
                    <th className="px-4 py-2">Sector</th>
                    <th className="px-4 py-2">Weight (%)</th>
                    <th className="px-4 py-2">Expected Annual Gain (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((rec, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{rec.ticker}</td>
                      <td className="px-4 py-2">{rec.sector}</td>
                      <td className="px-4 py-2">{rec.weight}</td>
                      <td className="px-4 py-2">{rec.expected_annual_gain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default PortfolioPieChart;
