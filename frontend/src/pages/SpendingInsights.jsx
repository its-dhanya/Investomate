import React, { useState } from 'react';
import Select from 'react-select';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

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
    expenses: [], 
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 
  const handleExpenseChange = (index, field, value) => {
    const updatedExpenses = [...formData.expenses];
    updatedExpenses[index] = { ...updatedExpenses[index], [field]: value };
    setFormData((prev) => ({ ...prev, expenses: updatedExpenses }));
  };

  
  const addExpense = () => {
    setFormData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, { item: '', amount: '', category: '' }],
    }));
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      expenses: formData.expenses.map((exp) => [exp.item, exp.amount, exp.category]),
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

  const chartData = {
    labels: formData.expenses.map((exp, index) => exp.item || `Expense ${index + 1}`),
    datasets: [
      {
        label: 'Expense Amount',
        data: formData.expenses.map((exp) => Number(exp.amount) || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // Tailwind blue-500
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Entered Expenses Overview',
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Spending Optimization</h1>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded p-6 mb-6">
        {/* Income */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Monthly Income
          </label>
          <input
            type="number"
            name="income"
            value={formData.income}
            onChange={handleChange}
            placeholder="e.g. 5000"
            className="border border-gray-300 rounded w-full py-2 px-3"
            required
          />
        </div>
        {/* Target Amount */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Target Amount
          </label>
          <input
            type="number"
            name="target_amount"
            value={formData.target_amount}
            onChange={handleChange}
            placeholder="e.g. 10000"
            className="border border-gray-300 rounded w-full py-2 px-3"
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
            placeholder="e.g. 5"
            className="border border-gray-300 rounded w-full py-2 px-3"
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
          <div
            key={index}
            className="mb-4 p-4 border border-gray-200 rounded bg-gray-50"
          >
            <div className="mb-2">
              <label className="block text-gray-700 mb-1">Item</label>
              <input
                type="text"
                value={expense.item}
                onChange={(e) =>
                  handleExpenseChange(index, 'item', e.target.value)
                }
                placeholder="e.g. Rent"
                className="border border-gray-300 rounded w-full py-1 px-2"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={expense.amount}
                onChange={(e) =>
                  handleExpenseChange(index, 'amount', e.target.value)
                }
                placeholder="e.g. 1500"
                className="border border-gray-300 rounded w-full py-1 px-2"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 mb-1">Category</label>
              <Select
                value={categoryOptions.find(
                  (cat) => cat.value === expense.category
                )}
                onChange={(selectedOption) =>
                  handleExpenseChange(index, 'category', selectedOption.value)
                }
                options={categoryOptions}
                placeholder="Select Category"
                className="text-gray-700"
                required
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addExpense}
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded mb-4"
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

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Chart Preview */}
      {formData.expenses.length > 0 && (
        <div className="mb-6 bg-white p-4 shadow-md rounded">
          <h2 className="text-xl font-semibold mb-2">Current Expense Overview</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}

      {/* Optimization Result */}
      {result && (
        <div className="bg-white p-6 shadow-md rounded">
          <h2 className="text-2xl font-bold mb-4">
            Optimization Result
          </h2>
          <table className="min-w-full bg-gray-100 rounded mb-4">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b-2 text-left">
                  Field
                </th>
                <th className="px-4 py-2 border-b-2 text-left">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {result['Optimized Needs'] !== undefined && (
                <tr>
                  <td className="px-4 py-2 border-b">Optimized Needs</td>
                  <td className="px-4 py-2 border-b">
                    {result['Optimized Needs']}
                  </td>
                </tr>
              )}
              {result['Optimized Wants'] !== undefined && (
                <tr>
                  <td className="px-4 py-2 border-b">Optimized Wants</td>
                  <td className="px-4 py-2 border-b">
                    {result['Optimized Wants']}
                  </td>
                </tr>
              )}
              {result['Optimized Savings'] !== undefined && (
                <tr>
                  <td className="px-4 py-2 border-b">Optimized Savings</td>
                  <td className="px-4 py-2 border-b">
                    {result['Optimized Savings']}
                  </td>
                </tr>
              )}
              {result['Monthly Savings Target'] !== undefined && (
                <tr>
                  <td className="px-4 py-2 border-b">Monthly Savings Target</td>
                  <td className="px-4 py-2 border-b">
                    {result['Monthly Savings Target']}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {result['Suggested Adjustments'] && (
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">
                Suggested Adjustments
              </h3>
              {result['Suggested Adjustments']['Success'] ? (
                <p className="text-green-600">
                  {result['Suggested Adjustments']['Success']}
                </p>
              ) : (
                <ul className="list-disc list-inside">
                  {Object.entries(result['Suggested Adjustments']).map(([key, value]) => (
                    key !== 'Success' && (
                      <li key={key}>
                        {key}: {value}
                      </li>
                    )
                  ))}
                </ul>
              )}
            </div>
          )}
          {result['Next Month Limits'] && (
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">
                Next Month Limits
              </h3>
              <ul className="list-disc list-inside">
                <li>
                  Needs: {result['Next Month Limits']['Needs']}
                </li>
                <li>
                  Wants: {result['Next Month Limits']['Wants']}
                </li>
                <li>
                  Savings: {result['Next Month Limits']['Savings']}
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Investment Suggestion if Interest Rate is below threshold */}
      {result && Number(formData.interest_rate) < 5 && (
        <div className="mt-6 p-4 border-l-4 border-red-500 bg-red-50">
          <p className="text-red-600 font-semibold">
            Your provided interest rate is below the average (5%). Consider exploring bank investments.
          </p>
        </div>
      )}
    </div>
  );
};

export default SpendingOptimization;