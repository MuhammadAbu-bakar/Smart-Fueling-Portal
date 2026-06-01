// src/components/SitesByCategoryTable.jsx
import React from "react";
import { Package, Download, AlertCircle } from "lucide-react";

const SitesByCategoryTable = ({ dgCategories, totalDGs, totalLess50, totalGreater50, isLoadingMaster, onExport }) => {
  return (
    <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
      <div className="bg-[#0a0f20] px-5 py-3 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold flex items-center gap-2">
              <Package size={18} className="text-cyan-400" />
              SITES BY CATEGORY
            </h3>
            <p className="text-gray-500 text-xs mt-1">Based on Severity & Remaining Fuel</p>
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all active:scale-95"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0f1325] border-b border-gray-700">
            <tr>
              <th className="p-3 text-left text-gray-400 font-medium text-xs">Category (Severity)</th>
              <th className="p-3 text-right text-gray-400 font-medium text-xs">Total Sites</th>
              <th className="p-3 text-right text-gray-400 font-medium text-xs">Fuel&lt;50L</th>
              <th className="p-3 text-right text-gray-400 font-medium text-xs">Fuel&gt;50L</th>
              <th className="p-3 text-right text-gray-400 font-medium text-xs">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoadingMaster ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">
                  <div className="flex justify-center items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    <span>Loading Categories...</span>
                  </div>
                </td>
              </tr>
            ) : (
              dgCategories.map((cat, idx) => {
                const percentage = totalDGs > 0 ? ((cat.total / totalDGs) * 100).toFixed(1) : 0;
                let colorClass = "text-gray-400";
                let bgClass = "";
                if (cat.name === "PTN Node") {
                  colorClass = "text-green-400";
                  bgClass = "bg-green-500/10";
                } else if (cat.name === "Critical Hub (10 ++)") {
                  colorClass = "text-red-400";
                  bgClass = "bg-red-500/10";
                } else if (cat.name === "Major Hub (5~10)") {
                  colorClass = "text-yellow-400";
                  bgClass = "bg-yellow-500/10";
                } else if (cat.name === "Minor Hub (1~4)") {
                  colorClass = "text-blue-400";
                  bgClass = "bg-blue-500/10";
                } else if (cat.name === "Single/FTTS") {
                  colorClass = "text-gray-400";
                  bgClass = "bg-gray-500/10";
                }
                
                return (
                  <tr key={idx} className={`hover:bg-white/5 transition-colors ${bgClass}`}>
                    <td className="p-3 text-white font-medium">
                      {cat.name}
                      {cat.total > 0 && (
                        <span className={`${colorClass} text-xs ml-2`}>({percentage}%)</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-gray-300 font-mono">{cat.total.toLocaleString()}</td>
                    <td className="p-3 text-right text-red-400 font-mono">{cat.less50.toLocaleString()}</td>
                    <td className="p-3 text-right text-green-400 font-mono">{cat.greater50.toLocaleString()}</td>
                    <td className="p-3 text-right text-gray-400 font-mono">
                      {cat.total > 0 ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs">{percentage}%</span>
                        </div>
                      ) : (
                        "0%"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {!isLoadingMaster && totalDGs > 0 && (
            <tfoot className="bg-[#0f1325] border-t border-gray-700">
              <tr>
                <td className="p-3 text-white font-bold">Total</td>
                <td className="p-3 text-right text-white font-bold">{totalDGs.toLocaleString()}</td>
                <td className="p-3 text-right text-red-400 font-bold">{totalLess50.toLocaleString()}</td>
                <td className="p-3 text-right text-green-400 font-bold">{totalGreater50.toLocaleString()}</td>
                <td className="p-3 text-right text-white font-bold">100%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {!isLoadingMaster && totalDGs === 0 && (
        <div className="p-8 text-center text-gray-400">
          <AlertCircle size={32} className="mx-auto mb-2 text-yellow-500" />
          <p>No sites found with valid Severity data in Column S</p>
          <p className="text-xs mt-2">Please check that Column S contains values like: PTN Node, Critical Hub (10 ++), Major Hub (5~10), Minor Hub (1~4), or Single/FTTS</p>
        </div>
      )}
    </div>
  );
};

export default SitesByCategoryTable;