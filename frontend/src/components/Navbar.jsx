import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { useAuth } from "../AuthContext"; 

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold text-blue-600">InvestoMate</Link>
      <div className="space-x-6">
        {!user ? (
          <>
            <Link to="/login" className="text-gray-700 hover:text-blue-500 font-medium">Login</Link>
            <Link to="/register" className="text-gray-700 hover:text-blue-500 font-medium">Sign Up</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-500 font-medium">Dashboard</Link>
            <Link to="/portfolio" className="text-gray-700 hover:text-blue-500 font-medium">Portfolio</Link>
            <Link to="/spending" className="text-gray-700 hover:text-blue-500 font-medium">Spending Insights</Link>
            <Link to="/investments" className="text-gray-700 hover:text-blue-500 font-medium">Investment Suggestions</Link>
            <Link to="/goals" className="text-gray-700 hover:text-blue-500 font-medium">Set Goals</Link>
            <button onClick={handleLogout} className="text-gray-700 hover:text-red-500 font-medium">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
