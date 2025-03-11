const InvestmentSuggestions = () => {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Investment Suggestions</h2>
        <p className="text-gray-600">Smart investment recommendations will appear here.</p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
            High-Yield Savings
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
            Diversified Stocks
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
            Cryptocurrency Options
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
            Low-Risk Bonds
          </div>
        </div>
      </div>
    );
  };
  
  export default InvestmentSuggestions;
  