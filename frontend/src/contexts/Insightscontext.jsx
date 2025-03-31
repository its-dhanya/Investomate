import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const InsightsContext = createContext();

export const InsightsProvider = ({ children }) => {
  const [insights, setInsights] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/insights")
      .then((response) => {
        console.log("Insights response:", response.data);
        setInsights(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching insights:", error);
        setLoading(false);
      });
  }, []);

  return (
    <InsightsContext.Provider value={{ insights, loading }}>
      {children}
    </InsightsContext.Provider>
  );
};

export const useInsights = () => useContext(InsightsContext);