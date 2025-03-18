import { useState } from "react";
import { auth, googleProvider } from "../firebaseConfig";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 🔐 Send user data to backend and store token
  const sendUserDataToBackend = async (user) => {
    try {
      const { uid, email, displayName } = user;
      const response = await axios.post("http://localhost:5001/api/auth", { 
        userid: uid, 
        email, 
        name: displayName || "Unknown User" 
      });

      // Store JWT token in localStorage
      localStorage.setItem("token", response.data.token);
      console.log("User authenticated, token stored");

      navigate("/dashboard");
    } catch (error) {
      console.error("Error sending user data to backend:", error);
      setError("Failed to authenticate. Please try again.");
    }
  };

  // 📌 Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in:", userCredential.user);

      // Send user data to backend for authentication
      await sendUserDataToBackend(userCredential.user);
    } catch (error) {
      setError("Invalid email or password.");
    }
  };

  // 📌 Google Login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google login successful:", result.user);

      // Send user data to backend for authentication
      await sendUserDataToBackend(result.user);
    } catch (error) {
      setError("Google login failed. Try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Login</h2>
        {error && <p className="text-red-500 text-center mb-2">{error}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition font-semibold">
            Login
          </button>
        </form>

        <button onClick={handleGoogleLogin} className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition mt-4">
          Sign in with Google
        </button>

        <p className="mt-4 text-center text-gray-600 text-sm">
          Don't have an account?{" "}
          <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => navigate("/register")}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
