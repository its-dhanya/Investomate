#!/usr/bin/env python3
# coding: utf-8

import os
import sys
import time
import json
import requests
import numpy as np
import pandas as pd
import yfinance as yf
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from google.generativeai import configure, GenerativeModel
import google.generativeai as genai
from bs4 import BeautifulSoup
import re
import warnings
import io
from contextlib import redirect_stdout
from dotenv import load_dotenv

warnings.filterwarnings("ignore")
load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set.")
configure(api_key=GEMINI_API_KEY)
model_id = "gemini-2.0-flash"
model = GenerativeModel(model_id)

CACHE_FILE = "articles_cache.json"
CACHE_EXPIRY = 3600

def load_cached_articles():
    if os.path.exists(CACHE_FILE):
        mtime = os.path.getmtime(CACHE_FILE)
        if time.time() - mtime < CACHE_EXPIRY:
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    articles = data.get("articles", [])
                    if articles:
                        return articles
            except Exception:
                pass
    return None

def save_cached_articles(articles):
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump({"articles": articles}, f)
    except Exception:
        pass

def get_moneycontrol_articles():
    cached = load_cached_articles()
    if cached is not None and len(cached) > 0:
        print("Using cached articles")
        return cached

    url = "https://www.moneycontrol.com/news/business/stocks/"
    headers = {
        "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/115.0.0.0 Safari/537.36"),
        "Referer": "https://www.moneycontrol.com/"
    }
    urls = []
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            print("Non-200 response", response.status_code, file=sys.stderr)
            return []
        soup = BeautifulSoup(response.text, 'html.parser')
        selectors = [
            {"tag": "ul", "attrs": {"class": "oceanNewsLst"}},
            {"tag": "div", "attrs": {"class": "pcNews_lst"}},
            {"tag": "ul", "attrs": {"class": "newsLst"}},
            {"tag": "div", "attrs": {"id": "latestNews"}},
            {"tag": "section", "attrs": {"class": "newsSec"}},
            {"tag": "div", "attrs": {"class": "article_list"}},
            {"tag": "div", "attrs": {"class": "latestNews"}},
            {"tag": "div", "attrs": {"class": "div_live_news"}},
            {"tag": "section", "attrs": {"id": "mc_story_box"}}
        ]
        container_found = False
        for sel in selectors:
            container = soup.find(sel["tag"], attrs=sel.get("attrs", {}))
            if container:
                for li in container.find_all("li"):
                    a = li.find("a", href=True)
                    if a and a["href"]:
                        urls.append(a["href"])
                if urls:
                    container_found = True
                    break
        if not container_found or not urls:
            print("Primary selectors failed, scanning all anchors", file=sys.stderr)
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if "/news/business/stocks/" in href:
                    urls.append(href)
        if not urls:
            print("Anchor scan did not return results, using regex fallback", file=sys.stderr)
            all_anchors = soup.find_all("a", href=True)
            pattern = re.compile(r"/news/business/stocks/")
            for a in all_anchors:
                if pattern.search(a["href"]):
                    urls.append(a["href"])
        urls = list(dict.fromkeys(urls))
        save_cached_articles(urls)
        return urls
    except Exception as e:
        print("Error scraping Moneycontrol articles:", e, file=sys.stderr)
        return []

def get_article_text(article_url):
    headers = {
        "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/115.0.0.0 Safari/537.36"),
        "Referer": "https://www.moneycontrol.com/"
    }
    try:
        response = requests.get(article_url, headers=headers, timeout=10)
        if response.status_code != 200:
            return ""
        soup = BeautifulSoup(response.text, "html.parser")
        paragraphs = soup.find_all("p")
        if not paragraphs:
            paragraphs = soup.find_all("div", class_="article_content")
        text = " ".join(p.get_text() for p in paragraphs)
        return text
    except Exception:
        return ""

def extract_stock_mentions(article_url):
    text = get_article_text(article_url)
    mentioned_tickers = [ticker for name, ticker in STOCK_TICKERS.items() if name in text]
    return mentioned_tickers, text

def perform_sentiment_analysis(text):
    analyzer = SentimentIntensityAnalyzer()
    return analyzer.polarity_scores(text)["compound"]

def get_trending_stock_sentiments():
    articles = get_moneycontrol_articles()
    stock_sentiments = {}
    for article in articles:
        tickers, text = extract_stock_mentions(article)
        if not text:
            continue
        sentiment_score = perform_sentiment_analysis(text)
        for ticker in tickers:
            if ticker in stock_sentiments:
                stock_sentiments[ticker]["total"] += sentiment_score
                stock_sentiments[ticker]["count"] += 1
            else:
                stock_sentiments[ticker] = {"total": sentiment_score, "count": 1}
    if not stock_sentiments:
        return []
    avg_sentiments = {ticker: data["total"] / data["count"] for ticker, data in stock_sentiments.items()}
    trending = sorted(avg_sentiments.items(), key=lambda x: x[1], reverse=True)
    return trending

def get_stock_data(ticker):
    stock = yf.download(ticker + ".NS", period="1y", interval="1d")
    return stock["Close"].values.reshape(-1, 1)

def prepare_data(data, sequence_length=60):
    scaler = MinMaxScaler(feature_range=(0, 1))
    data_scaled = scaler.fit_transform(data)
    X, y = [], []
    for i in range(sequence_length, len(data_scaled)):
        X.append(data_scaled[i-sequence_length:i, 0])
        y.append(data_scaled[i, 0])
    return np.array(X).reshape(-1, sequence_length, 1), np.array(y), scaler

def build_lstm_model(sequence_length=60):
    inputs = tf.keras.Input(shape=(sequence_length, 1))
    x = LSTM(50, return_sequences=True)(inputs)
    x = Dropout(0.2)(x)
    x = LSTM(50, return_sequences=True)(x)
    x = Dropout(0.2)(x)
    x = LSTM(50)(x)
    x = Dropout(0.2)(x)
    outputs = Dense(1)(x)
    model = tf.keras.Model(inputs, outputs)
    model.compile(optimizer="adam", loss="mean_squared_error")
    return model

def predict_stock_price(ticker):
    data = get_stock_data(ticker)
    if len(data) < 60:
        return None
    X, y, scaler = prepare_data(data)
    train_size = int(len(X) * 0.8)
    X_train, y_train = X[:train_size], y[:train_size]
    X_test, y_test = X[train_size:], y[train_size:]
    lstm_model = build_lstm_model()
    lstm_model.fit(X_train, y_train, epochs=10, batch_size=32, validation_data=(X_test, y_test), verbose=0)
    last_sequence = X[-1]
    future_prices = []
    for _ in range(10):
        next_price = lstm_model.predict(np.array([last_sequence]), verbose=0)[0][0]
        future_prices.append(next_price)
        last_sequence = np.append(last_sequence[1:], [[next_price]], axis=0)
    return scaler.inverse_transform(np.array(future_prices).reshape(-1, 1)).flatten()

def generate_insights(stock, sentiment_score, predicted_prices):
    avg_future_price = np.mean(predicted_prices)
    df = yf.download(stock + ".NS", period="1d")
    if "Adj Close" in df.columns:
        current_price = df["Adj Close"].values[0]
    elif "Close" in df.columns:
        current_price = df["Close"].values[0]
    else:
        raise ValueError("No price data available for " + stock)
    if sentiment_score > 0.5 and avg_future_price > current_price * 1.05:
        return "Strong Buy"
    elif sentiment_score > 0 and avg_future_price > current_price:
        return "Buy"
    elif sentiment_score < -0.5 and avg_future_price < current_price * 0.95:
        return "Strong Sell"
    else:
        return "Hold"

def get_historical_data(ticker):
    stock = yf.Ticker(ticker + ".NS")
    return stock.history(period="6mo")

def generate_gemini_insight(ticker, sentiment_score, predicted_prices, historical_data):
    last_price = historical_data["Close"].iloc[-1]
    avg_volume = historical_data["Volume"].mean()
    last_predicted_price = predicted_prices[-1]
    predicted_trend = "upward" if last_predicted_price > last_price else "downward"
    prompt = (
        f"For stock {ticker}, sentiment score is {sentiment_score:.2f}. "
        f"Last price: ₹{last_price:.2f}, Avg volume: {avg_volume:.0f}. "
        f"LSTM model predicts a {predicted_trend} trend with a future price of ₹{last_predicted_price:.2f}. "
        f"Give a one-line investment insight."
    )
    gemini_response = model.generate_content(prompt)
    return gemini_response.text.strip()

STOCK_TICKERS = {
    "HDFC Bank": "HDFCBANK", "ICICI Bank": "ICICIBANK", "State Bank of India": "SBIN",
    "Kotak Mahindra Bank": "KOTAKBANK", "Axis Bank": "AXISBANK", "IndusInd Bank": "INDUSINDBK",
    "Punjab National Bank": "PNB", "Bank of Baroda": "BANKBARODA", "Federal Bank": "FEDERALBNK",
    "IDFC First Bank": "IDFCFIRSTB", "Bajaj Finance": "BAJFINANCE", "Bajaj Finserv": "BAJAJFINSV",
    "HDFC Ltd": "HDFC", "SBI Life Insurance": "SBILIFE", "HDFC Life Insurance": "HDFCLIFE",
    "ICICI Prudential Life": "ICICIPRULI", "Tata Consultancy Services": "TCS", "Infosys": "INFY",
    "Wipro": "WIPRO", "HCL Technologies": "HCLTECH", "Tech Mahindra": "TECHM", "LTIMindtree": "LTIM",
    "Persistent Systems": "PERSISTENT", "Coforge": "COFORGE", "L&T Technology Services": "LTTS",
    "MphasiS": "MPHASIS", "Reliance Industries": "RELIANCE", "Indian Oil Corporation": "IOC",
    "Bharat Petroleum": "BPCL", "Hindustan Petroleum": "HPCL", "ONGC": "ONGC", "GAIL India": "GAIL",
    "Power Grid Corporation": "POWERGRID", "NTPC": "NTPC", "Tata Power": "TATAPOWER",
    "Adani Green Energy": "ADANIGREEN", "Adani Transmission": "ADANITRANS", "NHPC": "NHPC",
    "Maruti Suzuki": "MARUTI", "Tata Motors": "TATAMOTORS", "Mahindra & Mahindra": "M&M",
    "Bajaj Auto": "BAJAJ-AUTO", "Hero MotoCorp": "HEROMOTOCO", "Eicher Motors": "EICHERMOT",
    "Ashok Leyland": "ASHOKLEY", "TVS Motor": "TVSMOTOR", "Escorts Kubota": "ESCORTS",
    "Hindustan Unilever": "HINDUNILVR", "ITC": "ITC", "Nestle India": "NESTLEIND", "Dabur India": "DABUR",
    "Britannia Industries": "BRITANNIA", "Godrej Consumer": "GODREJCP", "Colgate-Palmolive": "COLPAL",
    "Marico": "MARICO", "Emami": "EMAMILTD", "Sun Pharma": "SUNPHARMA",
    "Dr Reddy's Laboratories": "DRREDDY", "Cipla": "CIPLA", "Lupin": "LUPIN",
    "Aurobindo Pharma": "AUROPHARMA", "Biocon": "BIOCON", "Torrent Pharma": "TORNTPHARM",
    "Divi's Laboratories": "DIVISLAB", "Glenmark Pharmaceuticals": "GLENMARK",
    "Tata Steel": "TATASTEEL", "JSW Steel": "JSWSTEEL", "Hindalco Industries": "HINDALCO",
    "Vedanta": "VEDL", "NMDC": "NMDC", "Coal India": "COALINDIA", "Jindal Steel & Power": "JINDALSTEL",
    "Larsen & Toubro": "LT", "Grasim Industries": "GRASIM", "UltraTech Cement": "ULTRACEMCO",
    "Shree Cement": "SHREECEM", "Ambuja Cements": "AMBUJACEM", "Dalmia Bharat": "DALBHARAT",
    "ACC": "ACC", "Bharti Airtel": "BHARTIARTL", "Vodafone Idea": "IDEA", "Sun TV Network": "SUNTV",
    "Zee Entertainment": "ZEEL", "Avenue Supermarts (DMart)": "DMART", "Trent": "TRENT",
    "Aditya Birla Fashion": "ABFRL", "Future Retail": "FRETAIL", "InterGlobe Aviation (IndiGo)": "INDIGO",
    "SpiceJet": "SPICEJET", "Container Corporation of India": "CONCOR", "Blue Dart Express": "BLUEDART",
    "Delhivery": "DELHIVERY", "Adani Enterprises": "ADANIENT", "Adani Ports": "ADANIPORTS",
    "Adani Power": "ADANIPOWER", "Adani Total Gas": "ATGL", "Adani Wilmar": "AWL"
}

def main():
    top_trending_stocks = get_trending_stock_sentiments()[:5]
    insights = {}
    for ticker, sentiment_score in top_trending_stocks:
        historical_data = get_historical_data(ticker)
        predicted_prices = predict_stock_price(ticker)
        if predicted_prices is not None:
            insights[ticker] = generate_gemini_insight(ticker, sentiment_score, predicted_prices, historical_data)
    return insights

if __name__ == "__main__":
    dummy_stdout = io.StringIO()
    with redirect_stdout(dummy_stdout):
        result = main()
    print(json.dumps(result, indent=2))