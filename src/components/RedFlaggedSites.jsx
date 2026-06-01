// src/components/RedFlaggedSites.jsx
import React from "react";
import { Flag, Download, Circle } from "lucide-react";

const RedFlaggedSites = ({ redFlaggedByCategory, totalRedFlagged, isLoadingMaster, onExport }) => {
  // Split into two rows - first 3 categories, remaining in second row
  const firstRowRedFlagged = redFlaggedByCategory.slice(0, 3);
  const secondRowRedFlagged = redFlaggedByCategory.slice(3);

  return (
    <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-full">
      <div className="bg-[#0a0f20] px-5 py-3 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold flex items-center gap-2">
              <Flag size={18} className="text-red-400" />
              RED FLAGGED SITES (NOK)
            </h3>
            <p className="text-gray-500 text-xs mt-1">NOK values by Category</p>
          </div>
          {totalRedFlagged > 0 && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 rounded-lg text-xs font-medium transition-all active:scale-95 text-red-300"
            >
              <Download size={14} />
              Export
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-5 flex flex-col">
        {isLoadingMaster ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400"></div>
            <span className="ml-2 text-gray-400">Loading flagged sites...</span>
          </div>
        ) : totalRedFlagged === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-3">
              <Circle size={24} className="text-green-400" />
            </div>
            <p className="text-gray-400">No red flagged sites found</p>
            <p className="text-xs text-gray-500 mt-1">Column J contains no NOK values</p>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-4">
            {/* Total Flagged Sites Banner */}
            <div className="flex items-center justify-between bg-red-900/20 rounded-xl p-3 border border-red-800/30">
              <div className="flex items-center gap-2">
                <Flag size={18} className="text-red-400" />
                <span className="text-white text-sm font-medium">Total Flagged Sites</span>
              </div>
              <span className="text-2xl font-bold text-red-400">{totalRedFlagged}</span>
            </div>
            
            {/* First Row - 3 Square Cards */}
            {firstRowRedFlagged.length > 0 && (
              <div className="grid grid-cols-3 gap-3 flex-1">
                {firstRowRedFlagged.map((item, idx) => {
                  let bgColor = "bg-red-500/10";
                  let borderColor = "border-red-500/30";
                  let percentage = totalRedFlagged > 0 ? ((item.count / totalRedFlagged) * 100).toFixed(1) : 0;
                  
                  if (item.category === "PTN Node") {
                    bgColor = "bg-green-500/10";
                    borderColor = "border-green-500/30";
                  } else if (item.category === "Critical Hub (10 ++)") {
                    bgColor = "bg-red-500/20";
                    borderColor = "border-red-500/50";
                  } else if (item.category === "Major Hub (5~10)") {
                    bgColor = "bg-yellow-500/10";
                    borderColor = "border-yellow-500/30";
                  } else if (item.category === "Minor Hub (1~4)") {
                    bgColor = "bg-blue-500/10";
                    borderColor = "border-blue-500/30";
                  } else if (item.category === "Single/FTTS") {
                    bgColor = "bg-gray-500/10";
                    borderColor = "border-gray-500/30";
                  }
                  
                  return (
                    <div 
                      key={idx} 
                      className={`${bgColor} rounded-xl p-3 border ${borderColor} flex flex-col items-center justify-center text-center min-h-[100px]`}
                    >
                      <span className="font-medium text-white text-xs mb-2 line-clamp-2">{item.category}</span>
                      <span className="text-2xl font-bold text-red-400">{item.count}</span>
                      <div className="w-full bg-gray-700 rounded-full h-1 mt-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-1 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Second Row - Remaining Categories (if any) */}
            {secondRowRedFlagged.length > 0 && (
              <div className="grid grid-cols-3 gap-3 flex-1">
                {secondRowRedFlagged.map((item, idx) => {
                  let bgColor = "bg-red-500/10";
                  let borderColor = "border-red-500/30";
                  let percentage = totalRedFlagged > 0 ? ((item.count / totalRedFlagged) * 100).toFixed(1) : 0;
                  
                  if (item.category === "PTN Node") {
                    bgColor = "bg-green-500/10";
                    borderColor = "border-green-500/30";
                  } else if (item.category === "Critical Hub (10 ++)") {
                    bgColor = "bg-red-500/20";
                    borderColor = "border-red-500/50";
                  } else if (item.category === "Major Hub (5~10)") {
                    bgColor = "bg-yellow-500/10";
                    borderColor = "border-yellow-500/30";
                  } else if (item.category === "Minor Hub (1~4)") {
                    bgColor = "bg-blue-500/10";
                    borderColor = "border-blue-500/30";
                  } else if (item.category === "Single/FTTS") {
                    bgColor = "bg-gray-500/10";
                    borderColor = "border-gray-500/30";
                  }
                  
                  return (
                    <div 
                      key={idx} 
                      className={`${bgColor} rounded-xl p-3 border ${borderColor} flex flex-col items-center justify-center text-center min-h-[100px]`}
                    >
                      <span className="font-medium text-white text-xs mb-2 line-clamp-2">{item.category}</span>
                      <span className="text-2xl font-bold text-red-400">{item.count}</span>
                      <div className="w-full bg-gray-700 rounded-full h-1 mt-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-1 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RedFlaggedSites;