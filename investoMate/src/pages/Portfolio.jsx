const Portfolio = () => {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Portfolio</h2>
        <p className="text-gray-600">Your investments will be displayed here.</p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
            Stock Investments
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
            Crypto Holdings
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
            Mutual Funds
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-gray-500 text-center">
            Bonds
          </div>
        </div>
      </div>
    );
  };
  
  export default Portfolio;
  