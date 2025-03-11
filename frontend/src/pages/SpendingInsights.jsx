const SpendingInsights = () => {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Spending Insights</h2>
        <p className="text-gray-600">Your spending insights will be displayed here.</p>
        <div className="mt-4">
          <div className="p-3 mb-2 border rounded-lg bg-gray-50 shadow-sm text-gray-500">
            Overspending Category
          </div>
          <div className="p-3 mb-2 border rounded-lg bg-gray-50 shadow-sm text-gray-500">
            Monthly Spending Breakdown
          </div>
        </div>
      </div>
    );
  };
  
  export default SpendingInsights;
  