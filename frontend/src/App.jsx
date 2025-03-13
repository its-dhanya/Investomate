import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import GoalSetting from "./pages/GoalSetting";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import SpendingInsights from "./pages/SpendingInsights";
import InvestmentSuggestions from "./pages/InvestmentSuggestions";
import MarketInsights from "./pages/MarketInsights"; 

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/goals" element={<GoalSetting />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/spending" element={<SpendingInsights />} />
        <Route path="/investments" element={<InvestmentSuggestions />} />
        <Route path="/market-insights" element={<MarketInsights />} />
        <Route path="/" element={<h1 className="text-center text-3xl mt-10">Welcome to InvestoMate</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
