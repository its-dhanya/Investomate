import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./AuthContext"; // Import AuthProvider
import { InsightsProvider } from "../src/contexts/Insightscontext"; // Import InsightsProvider
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <InsightsProvider>
        <App />
      </InsightsProvider>
    </AuthProvider>
  </React.StrictMode>
);