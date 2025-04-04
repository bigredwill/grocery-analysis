import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import Papa from 'papaparse';

const GroceryAnalysis = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryData, setCategoryData] = useState([]);
  const [storeData, setStoreData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    avgPerTrip: 0,
    totalTrips: 0,
    totalItems: 0
  });
  const [fileUploaded, setFileUploaded] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B'];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLoading(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target.result;
        processData(csvData);
      };
      reader.readAsText(file);
    }
  };

  const processData = (csvData) => {
    try {
      const parsedData = Papa.parse(csvData, {
        delimiter: ',',
        header: false,
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
      // Define headers - assuming CSV structure matches our expected format
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
      
      // Process category data
      const categories = {};
      cleanedData.forEach(item => {
        if (item.Category !== "CRV") {
          if (!categories[item.Category]) {
            categories[item.Category] = 0;
          }
          categories[item.Category] += item.Total;
        }
      });
      
      const categoryArray = Object.entries(categories).map(([name, spent]) => ({
        name,
        value: spent,
        percentage: (spent * 100 / cleanedData.reduce((sum, item) => sum + item.Total, 0)).toFixed(1)
      })).sort((a, b) => b.value - a.value);
      
      setCategoryData(categoryArray);
      
      // Process store data
      const stores = {};
      cleanedData.forEach(item => {
        if (!stores[item.Store]) {
          stores[item.Store] = 0;
        }
        stores[item.Store] += item.Total;
      });
      
      const storeArray = Object.entries(stores).map(([name, spent]) => ({
        name,
        value: spent,
        percentage: (spent * 100 / cleanedData.reduce((sum, item) => sum + item.Total, 0)).toFixed(1)
      })).sort((a, b) => b.value - a.value);
      
      setStoreData(storeArray);
      
      // Process monthly data
      const months = {};
      cleanedData.forEach(item => {
        if (typeof item.Date === 'string' && item.Date.includes('-')) {
          const month = item.Date.substring(0, 7); // Get YYYY-MM
          if (!months[month]) {
            months[month] = 0;
          }
          months[month] += item.Total;
        }
      });
      
      const monthArray = Object.entries(months).map(([month, spent]) => ({
        month,
        spent
      })).sort((a, b) => a.month.localeCompare(b.month));
      
      setMonthlyData(monthArray);
      
      // Process top items
      const items = {};
      cleanedData.forEach(row => {
        if (row.Category !== "CRV") {
          if (!items[row.Item]) {
            items[row.Item] = {
              count: 0,
              total: 0,
              category: row.Category
            };
          }
          items[row.Item].count++;
          items[row.Item].total += row.Total;
        }
      });
      
      const itemArray = Object.entries(items)
        .filter(([name, stats]) => stats.category !== 'CRV')
        .map(([name, stats]) => ({
          name,
          count: stats.count,
          total: stats.total,
          category: stats.category,
          avgPrice: (stats.total / stats.count).toFixed(2)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      setTopItems(itemArray);
      
      // Calculate overall stats
      const trips = {};
      cleanedData.forEach(item => {
        const tripKey = `${item.Date}`;
        if (!trips[tripKey]) {
          trips[tripKey] = {
            total: 0,
            items: 0
          };
        }
        trips[tripKey].total += item.Total;
        trips[tripKey].items++;
      });
      
      const totalSpent = cleanedData.reduce((sum, item) => sum + item.Total, 0);
      const totalTrips = Object.keys(trips).length;
      
      setStats({
        totalSpent,
        avgPerTrip: totalSpent / totalTrips,
        totalTrips,
        totalItems: cleanedData.length
      });
      
      setFileUploaded(true);
      setLoading(false);
    } catch (error) {
      console.error("Error processing file:", error);
      setLoading(false);
    }
  };

  // Load the example data for demo purposes
  useEffect(() => {
    const loadExampleData = async () => {
      try {
        // We'll load the default data when the component mounts
        // but this can be disabled if you only want to support uploads
        const response = await fetch('/combined_grocery_data.csv');
        const fileContent = await response.text();
        processData(fileContent);
      } catch (error) {
        console.error("Error loading example data:", error);
      }
    };
    
    loadExampleData();
  }, []);

  const formatCurrency = (value) => {
    return `$${value.toFixed(2)}`;
  };

  const renderUploadSection = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow mb-6 text-center">
        <h2 className="text-xl font-bold mb-4">Upload Your Grocery Receipt CSV</h2>
        <p className="mb-4 text-gray-600">
          Upload a CSV file with your grocery receipts to analyze your spending patterns.
          Expected format: Date, Store, Category, Item, Quantity, Unit, Price, Total
        </p>
        <div className="flex justify-center mb-4">
          <label className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer transition duration-300">
            <span>Select CSV File</span>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>
        {loading && <p className="text-gray-600">Processing your data...</p>}
      </div>
    );
  };

  const renderDashboard = () => {
    return (
      <>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Spent</h3>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats.totalSpent)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Shopping Trips</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalTrips}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Avg. per Trip</h3>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(stats.avgPerTrip)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Items</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalItems}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Spending by Category (Table)</h2>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-left text-sm font-semibold text-gray-600">Category</th>
                <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-right text-sm font-semibold text-gray-600">Amount</th>
                <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-100 text-right text-sm font-semibold text-gray-600">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {categoryData.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{entry.name}</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700 text-right">{formatCurrency(entry.value)}</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700 text-right">{entry.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Spending by Category */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({name, percentage}) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Spending by Store */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Spending by Store</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={storeData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({name, percentage}) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {storeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Monthly Spending Trend */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Monthly Spending Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="spent" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Top 10 Most Frequently Purchased Items */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Top 10 Most Frequently Purchased Items</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topItems}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value, name) => name === 'total' ? formatCurrency(value) : value} />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Purchase Frequency" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">2025 Freeside Grocery Shopping Analysis Dashboard</h1>
      
      {/* {renderUploadSection()} */}
      
      {fileUploaded ? renderDashboard() : (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600">Upload a CSV file to view your spending analysis</p>
        </div>
      )}
    </div>
  );
};

export default GroceryAnalysis;
