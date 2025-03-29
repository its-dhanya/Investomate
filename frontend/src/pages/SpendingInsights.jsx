import React, { useState } from 'react';
import Select from 'react-select';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

// Predefined expense categories
const categoryOptions = [
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'rent', label: 'Rent' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'misc', label: 'Misc' },
];

const SpendingOptimization = () => {
  const [formData, setFormData] = useState({
    income: '',
    target_amount: '',
    interest_rate: '',
    start_date: '',
    end_date: '',
    expenses: [], // each expense => { item: '', amount: '', category: '' }
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Handle standard text/number/date inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle expense item changes
  const handleExpenseChange = (index, field, value) => {
    const newExpenses = [...formData.expenses];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    setFormData((prev) => ({ ...prev, expenses: newExpenses }));
  };

  // Add a new expense row
  const addExpense = () => {
    setFormData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, { item: '', amount: '', category: '' }],
    }));
  };

  // Submit the form and call the backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Transform each expense object into an array: [item, amount, category]
    const payload = {
      ...formData,
      expenses: formData.expenses.map((exp) => [
        exp.item,
        exp.amount,
        exp.category,
      ]),
    };

    try {
      const response = await fetch('http://localhost:5001/api/optimize-spending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Error fetching optimization data.');
      }
      const data = await response.json();
      setResult(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  // Prepare chart data for the user-entered expenses (before optimization)
  const chartData = {
    labels: formData.expenses.map((exp) => exp.item || 'Unnamed'),
    datasets: [
      {
        label: 'Expense Amount',
        data: formData.expenses.map((exp) => Number(exp.amount) || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // Tailwind's blue-500
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Entered Expenses',
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Spending Optimization</h1>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded p-6 mb-6">
        {/* Income */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Monthly Income</label>
          <input
            type="number"
            name="income"
            value={formData.income}
            onChange={handleChange}
            className="border border-gray-300 rounded w-full py-2 px-3"
            placeholder="e.g. 5000"
            required
          />
        </div>

        {/* Target Amount */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Target Amount</label>
          <input
            type="number"
            name="target_amount"
            value={formData.target_amount}
            onChange={handleChange}
            className="border border-gray-300 rounded w-full py-2 px-3"
            placeholder="e.g. 10000"
            required
          />
        </div>

        {/* Interest Rate */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Annual Interest Rate (in %)
          </label>
          <input
            type="number"
            name="interest_rate"
            value={formData.interest_rate}
            onChange={handleChange}
            className="border border-gray-300 rounded w-full py-2 px-3"
            placeholder="e.g. 5"
            required
          />
        </div>

        {/* Start Date */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Start Date (YYYY-MM-DD)
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="border border-gray-300 rounded w-full py-2 px-3"
            required
          />
        </div>

        {/* End Date */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            End Date (YYYY-MM-DD)
          </label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="border border-gray-300 rounded w-full py-2 px-3"
            required
          />
        </div>

        {/* Expenses Section */}
        <h2 className="text-xl font-semibold mb-2">Expenses</h2>
        {formData.expenses.map((expense, index) => (
          <div key={index} className="mb-4 p-4 border border-gray-200 rounded bg-gray-50">
            <div className="mb-2">
              <label className="block text-gray-700 mb-1">Item</label>
              <input
                type="text"
                value={expense.item}
                onChange={(e) => handleExpenseChange(index, 'item', e.target.value)}
                className="border border-gray-300 rounded w-full py-1 px-2"
                placeholder="e.g. Rent"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={expense.amount}
                onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                className="border border-gray-300 rounded w-full py-1 px-2"
                placeholder="e.g. 1500"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 mb-1">Category</label>
              <Select
                value={categoryOptions.find((cat) => cat.value === expense.category)}
                onChange={(selectedOption) =>
                  handleExpenseChange(index, 'category', selectedOption.value)
                }
                options={categoryOptions}
                className="text-gray-700"
                placeholder="Select Category"
                required
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addExpense}
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
        >
          Add Expense
        </button>

        <div className="mt-6">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
          >
            Optimize Spending
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && <p className="text-red-500 text-lg font-semibold mt-4">{error}</p>}

      {/* Chart Preview of Entered Expenses */}
      {formData.expenses.length > 0 && (
        <div className="mb-6 bg-white p-4 shadow-md rounded">
          <h2 className="text-xl font-semibold mb-2">Current Expense Overview</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}

      {/* Optimization Result */}
      {result && (
        <div className="bg-white p-6 shadow-md rounded">
          <h2 className="text-2xl font-bold mb-4">Optimization Result</h2>
          <table className="min-w-full bg-gray-100 rounded">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b-2 text-left">Field</th>
                <th className="px-4 py-2 border-b-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border-b">Optimized Needs</td>
                <td className="px-4 py-2 border-b">{result['Optimized Needs']}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b">Optimized Wants</td>
                <td className="px-4 py-2 border-b">{result['Optimized Wants']}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b">Optimized Savings</td>
                <td className="px-4 py-2 border-b">{result['Optimized Savings']}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b">Monthly Savings Target</td>
                <td className="px-4 py-2 border-b">{result['Monthly Savings Target']}</td>
              </tr>
            </tbody>
          </table>

          {/* Additional sections if available */}
          {result['Suggested Adjustments'] && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold">Suggested Adjustments</h3>
              <p className="mt-2">
                {result['Suggested Adjustments']['Success'] || 'No suggestions available.'}
              </p>
            </div>
          )}

          {result['Next Month Limits'] && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold">Next Month Limits</h3>
              <ul className="list-disc list-inside mt-2">
                <li>Needs: {result['Next Month Limits']['Needs']}</li>
                <li>Wants: {result['Next Month Limits']['Wants']}</li>
                <li>Savings: {result['Next Month Limits']['Savings']}</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Investment Suggestion based on input interest rate */}
      {result && Number(formData.interest_rate) < 5 && (
        <div className="mt-6 p-4 border-l-4 border-red-500 bg-red-50">
          <p className="text-red-600">
            Your provided interest rate is below the average bank interest rate (5%). Consider opting for bank investment rather than portfolio management.
          </p>
        </div>
      )}
    </div>
  );
};

export default SpendingOptimization;
