import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

const ItemSearchComponent = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await window.fs.readFile('combined_grocery_data.csv', { encoding: 'utf8' });
        
        const parsedData = Papa.parse(response, {
          header: false,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        // Define headers - assuming CSV structure matches expected format
        const headers = ["Date", "Store", "Category", "Item", "Quantity", "Unit", "Price", "Total"];
        
        // Clean data
        const cleanedData = [];
        parsedData.data.forEach(row => {
          if (row.length < 8) return;
          
          const item = {};
          headers.forEach((header, index) => {
            item[header] = row[index];
          });
          
          if (typeof item.Total !== 'number') return;
          cleanedData.push(item);
        });
        
        setData(cleanedData);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Search for items
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    const term = searchTerm.toLowerCase();
    const results = data.filter(item => 
      item.Item && item.Item.toString().toLowerCase().includes(term)
    );
    
    setSearchResults(results);
    
    // Calculate total spent on this item
    const total = results.reduce((sum, item) => sum + item.Total, 0);
    setTotalSpent(total);
    
    // Process purchase history by date
    const historyByDate = {};
    results.forEach(item => {
      if (typeof item.Date === 'string') {
        const date = item.Date;
        if (!historyByDate[date]) {
          historyByDate[date] = {
            date,
            quantity: 0,
            total: 0
          };
        }
        historyByDate[date].quantity += item.Quantity || 1;
        historyByDate[date].total += item.Total;
      }
    });
    
    const historyArray = Object.values(historyByDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    setPurchaseHistory(historyArray);
    
    // Process price history (average price per unit over time)
    const priceByDate = {};
    results.forEach(item => {
      if (typeof item.Date === 'string' && item.Price && item.Quantity) {
        const date = item.Date;
        if (!priceByDate[date]) {
          priceByDate[date] = {
            date,
            price: item.Price
          };
        }
      }
    });
    
    const priceArray = Object.values(priceByDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    setPriceHistory(priceArray);
  };
  
  const formatCurrency = (value) => {
    return `$${value.toFixed(2)}`;
  };
  
  const renderResults = () => {
    if (searchResults.length === 0 && searchTerm) {
      return (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <p className="text-gray-600">No results found for "{searchTerm}"</p>
        </div>
      );
    }
    
    if (searchResults.length === 0) return null;
    
    return (
      <>
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="text-xl font-bold mb-2">Item Search Results</h2>
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-blue-600">{searchResults.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Avg Price</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalSpent / searchResults.length)}
              </p>
            </div>
          </div>
          
          <h3 className="font-semibold mb-2">Purchase History</h3>
          {purchaseHistory.length > 0 ? (
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={purchaseHistory}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="total" fill="#8884d8" name="Amount Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-600 mb-4">No purchase history available</p>
          )}
          
          <h3 className="font-semibold mb-2">Purchase Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">Date</th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">Store</th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">Item</th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-right text-sm font-semibold text-gray-600">Quantity</th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-right text-sm font-semibold text-gray-600">Price</th>
                  <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-right text-sm font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{item.Date}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{item.Store}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{item.Item}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700 text-right">{item.Quantity} {item.Unit}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700 text-right">{formatCurrency(item.Price)}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700 text-right">{formatCurrency(item.Total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };
  
  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-xl font-bold mb-4">Search for an Item</h2>
        <div className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for items (e.g., peanut butter, milk, bread)"
            className="flex-grow px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg transition duration-300"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>
      
      {renderResults()}
    </div>
  );
};

export default ItemSearchComponent;