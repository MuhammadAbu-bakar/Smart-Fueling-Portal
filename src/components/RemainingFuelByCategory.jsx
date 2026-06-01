// src/components/RemainingFuelByCategory.jsx
import React from "react";
import { Fuel, TrendingUp, Package } from "lucide-react";

const RemainingFuelByCategory = ({ title, data, totalFuel, regionColor, isLoadingMaster }) => {
  const getRegionStyles = () => {
    if (regionColor === "blue") {
      return {
        headerBg: "bg-blue-500/10",
        headerBorder: "border-blue-500/30",
        headerText: "text-blue-400",
        iconBg: "bg-blue-500/20",
        iconColor: "text-blue-400",
        progressBar: "from-blue-500 to-cyan-400",
        rowHighlight: "hover:bg-blue-500/5",
      };
    } else {
      return {
        headerBg: "bg-purple-500/10",
        headerBorder: "border-purple-500/30",
        headerText: "text-purple-400",
        iconBg: "bg-purple-500/20",
        iconColor: "text-purple-400",
        progressBar: "from-purple-500 to-pink-400",
        rowHighlight: "hover:bg-purple-500/5",
      };
    }
  };

  const styles = getRegionStyles();

  // Calculate percentages for progress bars
  const getPercentage = (fuel) => {
    if (totalFuel === 0) return 0;
    return ((fuel / totalFuel) * 100).toFixed(1);
  };

  if (isLoadingMaster) {
    return (
      <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-full">
        <div className={`bg-[#0a0f20] px-5 py-3 border-b border-gray-700 ${styles.headerBg}`}>
          <h3 className={`font-bold flex items-center gap-2 ${styles.headerText}`}>
            <Fuel size={18} />
            {title}
          </h3>
          <p className="text-gray-500 text-xs mt-1">Loading remaining fuel data...</p>
        </div>
        <div className="flex-1 p-5 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-full">
        <div className={`bg-[#0a0f20] px-5 py-3 border-b border-gray-700 ${styles.headerBg}`}>
          <h3 className={`font-bold flex items-center gap-2 ${styles.headerText}`}>
            <Fuel size={18} />
            {title}
          </h3>
          <p className="text-gray-500 text-xs mt-1">Remaining Fuel by Site Category</p>
        </div>
        <div className="flex-1 p-8 text-center text-gray-400">
          <Package size={32} className="mx-auto mb-2 opacity-50" />
          <p>No data available</p>
          <p className="text-xs mt-1">No sites found with valid Category data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-full">
      <div className={`bg-[#0a0f20] px-5 py-3 border-b border-gray-700 ${styles.headerBg}`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`font-bold flex items-center gap-2 ${styles.headerText}`}>
              <Fuel size={18} />
              {title}
            </h3>
            <p className="text-gray-500 text-xs mt-1">Remaining Fuel by Site Category</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">{totalFuel.toLocaleString()} L</p>
            <p className="text-[10px] text-gray-500">Total Remaining</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0f1325] border-b border-gray-700 sticky top-0">
            <tr>
              <th className="p-3 text-left text-gray-400 font-medium text-xs">Category (Site Type)</th>
              <th className="p-3 text-right text-gray-400 font-medium text-xs">Remaining Fuel (L)</th>
              <th className="p-3 text-right text-gray-400 font-medium text-xs">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((item, idx) => {
              const percentage = getPercentage(item.remainingFuel);
              let categoryColor = "text-gray-300";
              
              if (item.category === "PTN Node") {
                categoryColor = "text-cyan-400";
              } else if (item.category === "Critical Hub (10 ++)") {
                categoryColor = "text-red-400";
              } else if (item.category === "Major Hub (5~10)") {
                categoryColor = "text-orange-400";
              } else if (item.category === "Minor Hub (1~4)") {
                categoryColor = "text-yellow-400";
              } else if (item.category === "Single/FTTS") {
                categoryColor = "text-gray-400";
              }
              
              return (
                <tr key={idx} className={`${styles.rowHighlight} transition-colors`}>
                  <td className="p-3">
                    <span className={`font-medium ${categoryColor}`}>{item.category}</span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-white font-mono font-bold">
                      {item.remainingFuel.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">L</span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`bg-gradient-to-r ${styles.progressBar} h-1.5 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-10">{percentage}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-[#0f1325] border-t border-gray-700">
            <tr>
              <td className="p-3 text-white font-bold">Total</td>
              <td className="p-3 text-right text-white font-bold">{totalFuel.toLocaleString()} L</td>
              <td className="p-3 text-right text-white font-bold">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Visual connection indicator - dotted line from card to table */}
      <div className="relative">
        <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-16 h-4 border-l-2 border-r-2 ${regionColor === 'blue' ? 'border-blue-500/30' : 'border-purple-500/30'} border-t-2 border-dotted rounded-t-lg`}></div>
      </div>
    </div>
  );
};

export default RemainingFuelByCategory;