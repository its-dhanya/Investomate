#!/usr/bin/env python
# coding: utf-8

import os
import time
import numpy as np
import pandas as pd
import yfinance as yf
import pickle
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.preprocessing import MinMaxScaler
import argparse
import json
import sys
import warnings
import logging

from prophet import Prophet

# Suppress FutureWarnings and TensorFlow logging
warnings.filterwarnings("ignore", category=FutureWarning)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
logging.getLogger('tensorflow').setLevel(logging.ERROR)

# Log output to file so that debug output does not mix with JSON result.
logging.basicConfig(filename="debug.log", level=logging.INFO, 
                    format="%(asctime)s %(levelname)s: %(message)s")

# ------------------ SEED & DIRECTORIES ------------------
np.random.seed(42)
tf.random.set_seed(42)

CACHE_DIR = "cache"
MODEL_DIR = "saved_models"
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

EPSILON = 0.005
MIN_CANDIDATES = 2
CACHE_DURATION = 86400  # 1 day in seconds
LSTM_EPOCHS = 5         # Reduced training epochs
LOOK_BACK = 50          # Fixed look-back window

# ------------------ DATA CACHING ------------------
def get_historical_data_cached(ticker, period="1y", interval="1d", cache_duration=CACHE_DURATION):
    cache_filename = os.path.join(CACHE_DIR, f"{ticker}_{period}_{interval}.pkl")
    now = time.time()
    if os.path.exists(cache_filename):
        if now - os.path.getmtime(cache_filename) < cache_duration:
            try:
                return pd.read_pickle(cache_filename)
            except Exception as e:
                logging.error(f"Error reading cache for {ticker}: {e}")
    df = yf.download(ticker, period=period, interval=interval)
    df.dropna(inplace=True)
    df.to_pickle(cache_filename)
    return df

get_historical_data = get_historical_data_cached

# ------------------ MODEL CACHING ------------------
def load_trained_model(ticker, cache_duration=CACHE_DURATION):
    model_path = os.path.join(MODEL_DIR, f"{ticker}_lstm_model.keras")
    scaler_path = os.path.join(MODEL_DIR, f"{ticker}_scaler.pkl")
    if os.path.exists(model_path) and os.path.exists(scaler_path):
        if time.time() - os.path.getmtime(model_path) < cache_duration:
            try:
                model = load_model(model_path)
                with open(scaler_path, "rb") as f:
                    scaler = pickle.load(f)
                logging.info(f"✅ Loaded pre-trained model for {ticker}")
                return model, scaler, LOOK_BACK
            except Exception as e:
                logging.error(f"Error loading model for {ticker}: {e}")
    return None, None, None

def save_trained_model(ticker, model, scaler):
    model_path = os.path.join(MODEL_DIR, f"{ticker}_lstm_model.keras")
    scaler_path = os.path.join(MODEL_DIR, f"{ticker}_scaler.pkl")
    model.save(model_path)
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    logging.info(f"✅ Saved model for {ticker}")

# ------------------ LSTM TRAINING & FORECASTING ------------------
def train_lstm_model(ticker, epochs=LSTM_EPOCHS, batch_size=32):
    model, scaler, look_back = load_trained_model(ticker)
    if model is not None:
        return model, scaler, look_back

    logging.info(f"🔄 Training new LSTM model for {ticker}...")
    df = get_historical_data(ticker, period="1y", interval="1d")
    if df is None or df.empty:
        logging.error(f"❌ No data available for {ticker}.")
        return None, None, None

    data = df['Close'].values.reshape(-1, 1)
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(data)
    if len(scaled_data) <= LOOK_BACK:
        logging.error(f"Not enough data to train {ticker} (need > {LOOK_BACK} points).")
        return None, None, None

    X, y = [], []
    for i in range(LOOK_BACK, len(scaled_data)):
        X.append(scaled_data[i - LOOK_BACK:i, 0])
        y.append(scaled_data[i, 0])
    X, y = np.array(X), np.array(y)
    X = X.reshape(X.shape[0], X.shape[1], 1)

    # Use an explicit Input layer
    model = Sequential([
        tf.keras.Input(shape=(X.shape[1], 1)),
        LSTM(50, return_sequences=True),
        Dropout(0.2),
        LSTM(50),
        Dropout(0.2),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')
    callbacks = [
        EarlyStopping(monitor='loss', patience=2, restore_best_weights=True),
        ModelCheckpoint(os.path.join(MODEL_DIR, f"{ticker}_lstm_best.keras"), monitor='loss', save_best_only=True)
    ]
    model.fit(X, y, epochs=epochs, batch_size=batch_size, verbose=0, callbacks=callbacks)
    save_trained_model(ticker, model, scaler)
    return model, scaler, LOOK_BACK


def forecast_lstm_weekly(ticker, model, scaler, look_back=LOOK_BACK, forecast_weeks=5, days_per_week=5):
    df = get_historical_data(ticker, period="1y", interval="1d")
    if df is None or df.empty:
        return None
    data = df['Close'].values.reshape(-1, 1)
    scaled_data = scaler.transform(data)
    last_seq = scaled_data[-look_back:]
    weekly_forecasts = []
    for _ in range(forecast_weeks):
        for _ in range(days_per_week):
            X_input = last_seq.reshape(1, look_back, 1)
            pred = model.predict(X_input, verbose=0)[0][0]
            last_seq = np.append(last_seq[1:], [[pred]], axis=0)
        weekly_forecasts.append(pred)
    forecasted_prices = scaler.inverse_transform(np.array(weekly_forecasts).reshape(-1, 1)).flatten()
    return forecasted_prices

def compute_lstm_return(ticker, forecast_weeks=1, days_per_week=5):
    result = train_lstm_model(ticker, epochs=5, batch_size=32)
    if result is None:
        logging.error(f"❌ Model training failed for {ticker}")
        return None
    model, scaler, look_back = result

    pred_prices = forecast_lstm_weekly(ticker, model, scaler, look_back, forecast_weeks, days_per_week)
    if pred_prices is None or len(pred_prices) == 0:
        logging.error(f"❌ Forecasting failed for {ticker}")
        return None
    final_pred_price = float(pred_prices[-1])
    df_today = get_historical_data(ticker, period="1d", interval="1d")
    if df_today is None or df_today.empty:
        logging.error(f"❌ No current day data for {ticker}")
        return None
    current_price = float(df_today['Close'].iloc[0])
    if current_price <= 0:
        logging.error(f"❌ Invalid current price for {ticker}: {current_price}")
        return None
    short_term_return = (final_pred_price - current_price) / current_price
    return short_term_return

# ------------------ PROPHET FORECAST ------------------
def forecast_prophet(ticker, forecast_days=10):  # Reduced forecast horizon to 10 days
    df = get_historical_data(ticker)
    if df is None or df.empty:
        return None
    df_prophet = df.reset_index()[['Date', 'Close']].rename(columns={'Date': 'ds', 'Close': 'y'})
    if isinstance(df_prophet.columns, pd.MultiIndex):
        df_prophet.columns = df_prophet.columns.get_level_values(0)
    else:
        df_prophet.columns = [col.strip() for col in df_prophet.columns]
    df_prophet['y'] = pd.to_numeric(df_prophet['y'], errors='coerce')
    df_prophet = df_prophet.dropna(subset=['y'])
    if df_prophet.empty:
        return None
    model = Prophet(daily_seasonality=True, yearly_seasonality=True)
    model.fit(df_prophet)
    future = model.make_future_dataframe(periods=forecast_days)
    forecast = model.predict(future)
    return float(forecast['yhat'].iloc[-1])

# ------------------ ENSEMBLE FORECASTING ------------------
def ensemble_forecast(ticker, forecast_days_prophet=10, forecast_days_lstm=5):
    prophet_price = forecast_prophet(ticker, forecast_days=forecast_days_prophet)
    lstm_model, scaler, look_back = train_lstm_model(ticker, epochs=20, batch_size=32)
    lstm_prices = forecast_lstm_weekly(ticker, lstm_model, scaler, look_back, forecast_weeks=forecast_days_lstm, days_per_week=5)
    lstm_price = float(lstm_prices[-1])
    
    df_today = get_historical_data(ticker, period="1d", interval="1d")
    if df_today is None or df_today.empty:
        return None
    current_price = float(df_today['Close'].iloc[-1])
    prophet_return = (prophet_price - current_price) / current_price
    lstm_return = (lstm_price - current_price) / current_price
    ensemble_return = 0.5 * prophet_return + 0.5 * lstm_return

    # Use default dampening for speed
    dampening = 0.05  
    ensemble_return_adjusted = ensemble_return * dampening
    return ensemble_return_adjusted

# ------------------ HISTORICAL RETURN CALCULATION ------------------
def compute_historical_return(ticker, period="5y"):
    df = get_historical_data(ticker, period=period)
    if df is None or df.empty:
        return 0.0
    start = df['Close'].iloc[0]
    end = df['Close'].iloc[-1]
    years = (df.index[-1] - df.index[0]).days / 365.25
    if years <= 0:
        return 0.0
    annual_return = (end / start) ** (1 / years) - 1
    return annual_return

# ------------------ EXTENDED UNIVERSE ------------------
def get_extended_universe():
    # Define an extended list with at least 50 stocks.
    universe = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "JPM", "V", "DIS", "KO",
        "INTC", "CSCO", "ORCL", "IBM", "BA", "GE", "WMT", "PG", "NKE", "CRM",
        "ADBE", "MMM", "HON", "AXP", "UPS", "PM", "CAT", "MCD", "WFC", "C",
        "GS", "BK", "SBUX", "CVX", "XOM", "PFE", "MRK", "LLY", "ABT", "T",
        "VZ", "CMCSA", "NFLX", "TWTR", "SNAP", "UBER", "LYFT", "F", "GM", "AMD"
    ]
    return universe

# ------------------ PORTFOLIO RECOMMENDATION ------------------
def cap_weights(weights, cap):
    """
    Iteratively adjust weights so that no ticker's weight exceeds 'cap'.
    The excess is redistributed proportionally among those below the cap.
    """
    # Start with initial weights (which sum to 1)
    capped = dict(weights)
    while True:
        # Identify tickers that exceed the cap
        over_cap = {ticker: w for ticker, w in capped.items() if w > cap}
        if not over_cap:
            break  # All weights are within the cap
        # Calculate the total excess over the cap
        excess = sum(w - cap for w in over_cap.values())
        # Set weights for tickers over the cap to the cap
        for ticker in over_cap:
            capped[ticker] = cap
        # Identify tickers below the cap
        under_cap = {ticker: w for ticker, w in capped.items() if w < cap}
        total_under = sum(under_cap.values())
        # If there's no room for redistribution, break
        if total_under == 0:
            break
        # Redistribute the excess proportionally among under-cap tickers
        for ticker in under_cap:
            # Increase weight by proportion of current weight relative to total under-cap weight
            addition = excess * (capped[ticker] / total_under)
            capped[ticker] = min(capped[ticker] + addition, cap)
        # Re-normalize so that the weights sum to 1
        total = sum(capped.values())
        for ticker in capped:
            capped[ticker] /= total
    return capped

def recommend_portfolio(risk_level, income, goal_duration, monthly_investment, target_amount, sector_cap=0.30):
    universe = get_extended_universe()
    computed_returns = {}
    for ticker in universe:
        try:
            short_ret = compute_lstm_return(ticker, forecast_weeks=1, days_per_week=5)
            if short_ret is None:
                continue
            if short_ret > 0:
                computed_returns[ticker] = short_ret
        except Exception as e:
            logging.error(f"Error computing return for {ticker}: {e}")
            continue

    if not computed_returns or len(computed_returns) < MIN_CANDIDATES:
        logging.error("Not enough diversified candidates found.")
        return (None, None)

    # Dynamic filtering: keep only tickers above the 75th percentile
    returns_array = np.array(list(computed_returns.values()))
    threshold = np.percentile(returns_array, 75)
    logging.info(f"Dynamic threshold (75th percentile): {threshold:.4f}")
    filtered_scores = {ticker: (ret, ret) for ticker, ret in computed_returns.items() if ret >= threshold}
    if not filtered_scores or len(filtered_scores) < MIN_CANDIDATES:
        logging.error("Not enough candidates remain after filtering by percentile.")
        return (None, None)

    # Gather additional ticker info (sector, market cap)
    ticker_details = {}
    for ticker in filtered_scores.keys():
        try:
            info = yf.Ticker(ticker).info
            market_cap = info.get('marketCap', 1)
            sector = info.get('sector', 'Unknown')
            ticker_details[ticker] = {'market_cap': market_cap, 'sector': sector}
        except Exception as e:
            logging.error(f"Error fetching info for {ticker}: {e}")
            ticker_details[ticker] = {'market_cap': 1, 'sector': 'Unknown'}

    # Calculate weighted scores using short-term return and market cap
    weighted_scores = {ticker: filtered_scores[ticker][0] * ticker_details[ticker]['market_cap']
                       for ticker in filtered_scores.keys()}
    total_weight = sum(weighted_scores.values())
    if total_weight == 0:
        return (None, None)
    allocation = {ticker: weighted_scores[ticker] / total_weight for ticker in weighted_scores}

    # Apply a maximum weight cap (e.g., 30% or 0.30) dynamically
    const_max_weight = 0.30
    allocation = cap_weights(allocation, const_max_weight)

    # Compute overall portfolio expected annual return using our short-term proxy
    portfolio_expected_return = sum(allocation[ticker] * filtered_scores[ticker][1] for ticker in allocation)
    if portfolio_expected_return <= 0:
        logging.error("Overall portfolio expected return is non-positive.")
        return (None, None)

    r_monthly = (1 + portfolio_expected_return)**(1/12) - 1
    n = goal_duration * 12
    required_PMT = target_amount * r_monthly / ((1 + r_monthly)**n - 1)

    # Build result details for each ticker
    recommendations = []
    for ticker in allocation:
        rec = {
            "ticker": ticker,
            "weight": round(allocation[ticker] * 100, 1),  # percentage
            "sector": ticker_details[ticker]['sector'],
            "expected_annual_gain": round(filtered_scores[ticker][1] * 100, 2)  # percentage
        }
        recommendations.append(rec)

    logging.info("Selected Stocks & Details:")
    for rec in recommendations:
        logging.info(f"{rec['ticker']}: Sector: {rec['sector']}, Weight: {rec['weight']}%, Expected Annual Gain: {rec['expected_annual_gain']}%")
    logging.info(f"Estimated Portfolio Annual Return: {portfolio_expected_return*100:.2f}%")
    logging.info(f"Required Monthly Investment (estimated): ${required_PMT:,.2f}")
    
    return recommendations, required_PMT





# ------------------ COMMAND-LINE INTERFACE ------------------
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Portfolio Recommendation based on Goal Settings")
    parser.add_argument('--risk_level', type=str, required=True, help="Risk level (Conservative, Moderate, Aggressive)")
    parser.add_argument('--income', type=float, required=True, help="Monthly income in dollars")
    parser.add_argument('--goal_duration', type=int, required=True, help="Goal duration in years")
    parser.add_argument('--monthly_investment', type=float, required=True, help="Current monthly investment in dollars")
    parser.add_argument('--target_amount', type=float, required=True, help="Target goal amount in dollars")
    
    args = parser.parse_args()
    
    recommendations, required_PMT = recommend_portfolio(
        args.risk_level,
        args.income,
        args.goal_duration,
        args.monthly_investment,
        args.target_amount
    )
    
    result = {
        "recommendations": recommendations,
        "required_PMT": required_PMT
    }
    print(json.dumps(result))
