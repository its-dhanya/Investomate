#!/usr/bin/env python3
# coding: utf-8

import os
import sys
import time
import json
import warnings
from datetime import datetime

warnings.filterwarnings("ignore")

def classify_expenses(expenses):
    categorized_expenses = {"Needs": [], "Wants": [], "Savings": []}
    needs_categories = {"health", "education", "rent", "groceries"}
    wants_categories = {"shopping", "misc"}
    for item, amount, category in expenses:
        try:
            amount = float(amount)
        except Exception:
            amount = 0.0
        if category.lower() in needs_categories:
            categorized_expenses["Needs"].append((item, amount))
        elif category.lower() in wants_categories:
            categorized_expenses["Wants"].append((item, amount))
        else:
            categorized_expenses["Savings"].append((item, amount))
    return categorized_expenses

def calculate_amortized_payment(target_amount, interest_rate, months):
    interest_rate = max(interest_rate, 5)
    if interest_rate == 0:
        return target_amount / months
    r = interest_rate / 100 / 12
    return (target_amount * r) / (1 - (1 + r) ** -months)

def optimize_spending(income, expenses, target_amount, interest_rate, start_date, end_date):
    categorized_expenses = classify_expenses(expenses)
    total_needs = round(sum(amount for _, amount in categorized_expenses["Needs"]), 2)
    total_wants = round(sum(amount for _, amount in categorized_expenses["Wants"]), 2)
    total_savings = round(sum(amount for _, amount in categorized_expenses["Savings"]), 2)
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    months = max(1, (end.year - start.year) * 12 + (end.month - start.month))
    monthly_savings_needed = round(calculate_amortized_payment(target_amount, interest_rate, months), 2)
    if monthly_savings_needed > income:
        return {
            "error": f"Sorry, the target is not reachable within the given timeframe. Consider increasing income by at least {monthly_savings_needed - income:.2f} through other sources."
        }
    discretionary_income = income - total_needs
    optimized_savings = round(min(discretionary_income, monthly_savings_needed), 2)
    optimized_wants = round(discretionary_income - optimized_savings, 2)
    recommendations = {
        "Monthly Savings Target": monthly_savings_needed,
        "Suggested Adjustments": {}
    }
    if optimized_savings < monthly_savings_needed:
        excess_needed = round(monthly_savings_needed - optimized_savings, 2)
        cut_wants = round(min(total_wants, excess_needed), 2)
        recommendations["Suggested Adjustments"]["Reduce Wants"] = cut_wants
        optimized_wants -= cut_wants
        optimized_savings += cut_wants
        if optimized_savings < monthly_savings_needed:
            recommendations["Suggested Adjustments"]["Increase Income"] = f"Increase income by at least {monthly_savings_needed - optimized_savings:.2f}"
            recommendations["Suggested Adjustments"]["Reduce Needs"] = "Evaluate and reduce fixed expenses if possible. Consider cutting costs in groceries."
    else:
        recommendations["Suggested Adjustments"]["Success"] = "You are on the right track!"
    new_target_amount = target_amount - optimized_savings
    new_months = max(1, months - 1)
    new_monthly_savings_needed = round(calculate_amortized_payment(new_target_amount, interest_rate, new_months), 2)
    total_next_month = total_needs + optimized_wants + new_monthly_savings_needed
    scale_factor = income / total_next_month if total_next_month > 0 else 1
    min_needs = round(max(total_needs * scale_factor, 1000), 2)
    if min_needs > income:
        recommendations["Suggested Adjustments"]["Cut Fixed Costs"] = "Consider reducing costs in groceries and other essential expenses."
    recommendations["Next Month Limits"] = {
        "Needs": min_needs,
        "Wants": round(max(0, optimized_wants * scale_factor), 2),
        "Savings": round(max(0, new_monthly_savings_needed * scale_factor), 2)
    }
    recommendations["Next Month Savings Target"] = new_monthly_savings_needed
    return recommendations

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
    try:
        input_data = json.loads(sys.argv[1])
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}))
        sys.exit(1)
    try:
        income = float(input_data["income"])
        target_amount = float(input_data["target_amount"])
        interest_rate = float(input_data["interest_rate"])
        start_date = input_data["start_date"]
        end_date = input_data["end_date"]
        expenses = input_data["expenses"]
    except Exception as e:
        print(json.dumps({"error": f"Invalid input format: {str(e)}"}))
        sys.exit(1)
    result = optimize_spending(income, expenses, target_amount, interest_rate, start_date, end_date)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()