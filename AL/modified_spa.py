import sys
import os
import io
import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json
import logging
from datetime import datetime, timedelta
import warnings
from contextlib import redirect_stdout


warnings.filterwarnings("ignore")
warnings.filterwarnings("ignore", module="yfinance")

sys.stderr = open(os.devnull, "w")


LOG_FILE = "modified_spy.log"
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger()


capture_buffer = io.StringIO()
with redirect_stdout(capture_buffer):
    try:
        investments = json.loads(sys.argv[1])
        logger.info("Loaded investments from command-line argument.")
    except Exception as e:
        logger.error(f"Error loading investments: {e}")
        sys.exit(1)

    tickers = [item['ticker'] for item in investments]
    weights = {item['ticker']: item['weight'] for item in investments}
    total_investment = sum(weights.values())

    weights = {ticker: amount / total_investment for ticker, amount in weights.items()}

    end_date = datetime.today().strftime('%Y-%m-%d')
    start_date = (datetime.today() - timedelta(days=365)).strftime('%Y-%m-%d')

    try:
        stocks = yf.download(tickers, start=start_date, end=end_date, progress=False)
        stocks.to_csv("ai_companies_stocks.csv")
        ai_stocks = pd.read_csv("ai_companies_stocks.csv", header=[0, 1], index_col=[0], parse_dates=[0])
        logger.info("Downloaded and loaded stock data.")
    except Exception as e:
        logger.error(f"Error downloading or loading stock data: {e}")
        sys.exit(1)


    close = ai_stocks.loc[:, "Close"].copy()


    normalized_close = close.div(close.iloc[0]).mul(100)


    close_returns = close.pct_change().dropna()

    stocks_summary = close_returns.describe().T.loc[:, ["mean", "std"]]
    stocks_summary["mean"] = stocks_summary["mean"] * 260  # Annualized return.
    stocks_summary["std"] = stocks_summary["std"] * np.sqrt(260)  # Annualized risk.


    weights_array = np.array([weights[ticker] for ticker in tickers])
    portfolio_return = np.dot(weights_array, stocks_summary["mean"])
    portfolio_risk = np.sqrt(weights_array.T @ close_returns.cov().values @ weights_array) * np.sqrt(260)


    fig_dir = "static"
    if not os.path.exists(fig_dir):
        os.makedirs(fig_dir)

    try:
   
        fig1, ax1 = plt.subplots(figsize=[15, 8])
        close.plot(ax=ax1)
        ax1.set_title("Stock Closing Prices Over Time")
        stock_prices_path = f"{fig_dir}/stock_prices.png"
        fig1.savefig(stock_prices_path)
        plt.close(fig1)
        logger.info("Saved stock prices plot.")

        
        fig2, ax2 = plt.subplots(figsize=(12, 8))
        stocks_summary.plot.scatter(x="std", y="mean", s=50, fontsize=15, ax=ax2)
        ax2.scatter(portfolio_risk, portfolio_return, color='red', marker='X', s=100, label='Portfolio')
        for i in stocks_summary.index:
            ax2.annotate(i, xy=(stocks_summary.loc[i, "std"] + 0.002, stocks_summary.loc[i, "mean"] + 0.002), size=15)
        ax2.set_xlabel("Annual Risk (St. D)")
        ax2.set_ylabel("Annual Return")
        ax2.set_title("Stock Comparison with Risk Metrics (Risk/Return)")
        ax2.legend()
        scatter_plot_path = f"{fig_dir}/risk_return_scatter.png"
        fig2.savefig(scatter_plot_path)
        plt.close(fig2)
        logger.info("Saved risk vs return scatter plot.")

       
        fig3, ax3 = plt.subplots(figsize=(12, 8))
        sns.heatmap(close_returns.corr(), cmap="Reds", annot=True, annot_kws={"size": 15}, vmin=-1, vmax=1, ax=ax3)
        ax3.set_title("Stock Correlation Matrix")
        heatmap_path = f"{fig_dir}/correlation_heatmap.png"
        fig3.savefig(heatmap_path)
        plt.close(fig3)
        logger.info("Saved correlation heatmap.")
    except Exception as e:
        logger.error(f"Error creating or saving plots: {e}")
        sys.exit(1)
    output = {
        "portfolio_return": f"{portfolio_return:.2%}",
        "portfolio_risk": f"{portfolio_risk:.2%}",
        "stock_prices_chart": stock_prices_path,
        "risk_return_scatter": scatter_plot_path,
        "correlation_heatmap": heatmap_path
    }
    try:
        output_json = json.dumps(output)
        logger.info(f"Generated JSON output: {output_json}")
    except (TypeError, ValueError) as e:
        logger.error(f"Error generating JSON output: {e}")
        output_json = json.dumps({"error": str(e)})


sys.__stdout__.write(output_json)