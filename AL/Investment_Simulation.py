#!/usr/bin/env python
# coding: utf-8

import os
import json
import numpy as np
import argparse
from alpha_vantage.timeseries import TimeSeries

ALPHA_VANTAGE_API_KEY = os.environ.get("ALPHA_VANTAGE_API_KEY", "YOUR_API_KEY_HERE")

def randn_bm():
    # Generate a random number from a standard normal distribution using the Box-Muller transform.
    u = np.random.rand()
    v = np.random.rand()
    return np.sqrt(-2.0 * np.log(u)) * np.cos(2.0 * np.pi * v)

def simulate_portfolio(initial_amount, monthly_contribution, years, annual_return, volatility):
    # Simulate a portfolio's monthly value over 'years'
    months = years * 12
    portfolio = initial_amount
    monthly_return = (1 + annual_return) ** (1 / 12) - 1
    monthly_vol = volatility / np.sqrt(12)
    portfolio_values = []
    
    for _ in range(months):
        random_shock = monthly_vol * randn_bm()
        monthly_growth = monthly_return + random_shock
        portfolio = portfolio * (1 + monthly_growth) + monthly_contribution
        portfolio_values.append(portfolio)
    
    return portfolio_values

def get_stock_stats(ticker, period_days=5*252):
    ts = TimeSeries(key=ALPHA_VANTAGE_API_KEY, output_format='pandas', indexing_type='date')
    data, _ = ts.get_daily(symbol=ticker, outputsize='full')
    data.sort_index(inplace=True)
    if len(data) < period_days:
        raise ValueError(f"Not enough data for ticker: {ticker}")
    data = data.tail(period_days)
    
    if "4. close" not in data.columns:
        raise ValueError(f"Expected '4. close' column not found for ticker: {ticker}")
    
    data['Daily Return'] = data["4. close"].pct_change().dropna()
    if data.empty:
        raise ValueError(f"Not enough data to calculate daily returns for ticker: {ticker}")
    
    annual_return = (1 + data['Daily Return'].mean()) ** 252 - 1
    annual_volatility = data['Daily Return'].std() * np.sqrt(252)
    
    return annual_return, annual_volatility

def main():
    parser = argparse.ArgumentParser(description="Portfolio Investment Simulation")
    parser.add_argument("--ticker", type=str, required=True, help="Comma-separated stock tickers")
    parser.add_argument("--years", type=int, required=True, help="Investment duration in years")
    parser.add_argument("--initialAmount", type=float, required=True, help="Initial investment amount")
    parser.add_argument("--monthlyContribution", type=float, required=True, help="Monthly contribution")
    args = parser.parse_args()

    tickers = [t.strip().upper() for t in args.ticker.split(",")]
    years = args.years
    initial_amount = args.initialAmount
    monthly_contribution = args.monthlyContribution

    portfolio_paths = []
    final_values = []

    for ticker in tickers:
        try:
            annual_ret, volatility = get_stock_stats(ticker)
        except Exception as e:
            print(json.dumps({"error": f"Error fetching stats for {ticker}: {str(e)}"}))
            return

        values = simulate_portfolio(initial_amount, monthly_contribution, years, annual_ret, volatility)
        portfolio_paths.append({
            "ticker": ticker,
            "values": values
        })
        final_values.append(values[-1])

    median_value = float(np.percentile(final_values, 50))
    p10 = float(np.percentile(final_values, 10))
    p90 = float(np.percentile(final_values, 90))

    result = {
        "tickers": tickers,
        "years": years,
        "median_value": median_value,
        "p10": p10,
        "p90": p90,
        "portfolio_paths": portfolio_paths
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
