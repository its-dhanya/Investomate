import { useState } from "react";
import { Slider, Button, TextField, Typography, Box, Grid, Card, CardContent } from "@mui/material";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

export default function InvestmentSimulation() {
  const [tickers, setTickers] = useState("AAPL,MSFT,GOOGL");
  const [percentages, setPercentages] = useState("40,30,30");  // Default allocations (should sum to 100)
  const [investmentAmount, setInvestmentAmount] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [years, setYears] = useState(5);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Parse tickers and percentages
    const tickerList = tickers.split(",").map(t => t.trim());
    const percentageList = percentages.split(",").map(p => parseFloat(p.trim()));

    // Validation: Ensure percentages sum to 100
    const totalPercentage = percentageList.reduce((acc, val) => acc + val, 0);
    if (totalPercentage !== 100) {
      setError("Stock allocations must sum to 100%.");
      setLoading(false);
      return;
    }

    // Validate: Ensure tickers and percentages match
    if (tickerList.length !== percentageList.length) {
      setError("The number of stock tickers and percentage allocations must match.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5001/simulate", {
        ticker: tickerList,
        percentages: percentageList,
        years,
        initialAmount: investmentAmount,
        monthlyContribution,
      });

      if (response.data.error) {
        setError(response.data.error);
        return;
      }

      setResult(response.data);
    } catch (err) {
      setError("Failed to fetch simulation results. Backend issue?");
    } finally {
      setLoading(false);
    }
  };

  const transformChartData = (data) => {
    if (!data || !data.portfolio_paths || data.portfolio_paths.length === 0) {
      return [];
    }
    const numMonths = data.portfolio_paths[0].values.length;
    return Array.from({ length: numMonths }, (_, i) => {
      let point = { month: i + 1 };
      data.portfolio_paths.forEach((path) => {
        point[path.ticker] = path.values[i];
      });
      return point;
    });
  };

  const chartData = transformChartData(result);

  return (
    <Box sx={{ maxWidth: 900, margin: "auto", p: 4 }}>
      <Typography variant="h4" align="center" sx={{ mb: 4, fontWeight: "bold" }}>
        📈 Investment Simulation
      </Typography>

      <Card sx={{ mb: 4, p: 3, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Stock Tickers (comma-separated)"
                variant="outlined"
                value={tickers}
                onChange={(e) => setTickers(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Stock Allocations (%) (comma-separated, must sum to 100)"
                variant="outlined"
                value={percentages}
                onChange={(e) => setPercentages(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography fontSize={18} fontWeight={600}>💰 Investment Amount: ${investmentAmount}</Typography>
              <Slider
                value={investmentAmount}
                onChange={(_, val) => setInvestmentAmount(val)}
                min={1000}
                max={100000}
                step={1000}
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography fontSize={18} fontWeight={600}>📩 Monthly Contribution: ${monthlyContribution}</Typography>
              <Slider
                value={monthlyContribution}
                onChange={(_, val) => setMonthlyContribution(val)}
                min={100}
                max={5000}
                step={100}
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography fontSize={18} fontWeight={600}>⏳ Duration (Years): {years}</Typography>
              <Slider
                value={years}
                onChange={(_, val) => setYears(val)}
                min={1}
                max={50}
                step={1}
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12} align="center">
              <Button variant="contained" color="primary" onClick={handleSimulation} disabled={loading}>
                {loading ? "Simulating..." : "Run Simulation"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Typography variant="body1" color="error" align="center" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {result && (
        <Card sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" align="center" sx={{ mb: 2, fontWeight: "bold" }}>
              📊 Simulation Results
            </Typography>

            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Typography variant="h6" color="primary">
                  🔵 Median: ${result.median_value?.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="h6" color="error">
                  🔻 10th Percentile: ${result.p10?.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="h6" color="success">
                  🟢 90th Percentile: ${result.p90?.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>

            {chartData.length > 0 ? (
              <Box sx={{ mt: 4 }}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" label={{ value: "Month", position: "insideBottom", offset: -5 }} />
                    <YAxis label={{ value: "Portfolio Value ($)", angle: -90, position: "insideLeft" }} />
                    <RechartsTooltip formatter={(value) => new Intl.NumberFormat("en").format(value)} />
                    <Legend />
                    {result.portfolio_paths.map((path, idx) => (
                      <Line
                        key={idx}
                        type="monotone"
                        dataKey={path.ticker}
                        stroke={`hsl(${(idx * 80) % 360}, 70%, 50%)`}
                        dot={false}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography align="center" sx={{ mt: 2 }}>
                No chart data available.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
