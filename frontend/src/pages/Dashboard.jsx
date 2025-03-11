import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">Welcome to Your Dashboard</h1>
        <p className="text-gray-600 mt-2">Start tracking your financial goals today!</p>
        <button
          onClick={() => navigate("/goals")}
          className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Set a Goal
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
