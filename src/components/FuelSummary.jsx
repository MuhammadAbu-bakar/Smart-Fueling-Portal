// src/components/FuelSummary.jsx
import React from "react";
import { Package, Fuel, TrendingUp, AlertTriangle, Filter } from "lucide-react";

const FuelSummary = ({
  selectedMonth,
  availableMonths,
  onMonthChange,
  fuelData,
  isLoading,
}) => {
  return (
    <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package size={20} className="text-blue-400" />
            FUEL SUMMARY
          </h2>
          <p className="text-gray-400 text-xs">Monthly Fuel Performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#0f1325] px-3 py-1.5 rounded-lg border border-gray-700">
            <Filter size={14} className="text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none"
              disabled={isLoading || availableMonths.length === 0}
            >
              {availableMonths.map((month) => (
                <option key={month} value={month} className="bg-[#13182b]">
                  {month}
                </option>
              ))}
            </select>
          </div>
          <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded-full">
            {selectedMonth || "Select Month"}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-400">
          <div className="animate-spin inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
          Loading fuel data...
        </div>
      ) : (
        <>
          <div className="p-5 pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Card */}
            <div className="bg-[#0f1325]/70 rounded-xl p-4 text-center border border-gray-700/50 hover:border-blue-500/50 transition-colors">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Fuel size={18} className="text-blue-400" />
                <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                  TARGET FUEL
                </p>
              </div>
              <p className="text-2xl font-bold text-white">
                {fuelData.target.toLocaleString()}{" "}
                <span className="text-xs font-normal text-gray-400">L</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Monthly Target</p>
            </div>

            {/* Dispersion Card */}
            <div className="bg-[#0f1325]/70 rounded-xl p-4 text-center border border-gray-700/50 hover:border-green-500/50 transition-colors">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp size={18} className="text-green-400" />
                <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                  DISPERSION
                </p>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {fuelData.dispersion.toLocaleString()}{" "}
                <span className="text-xs font-normal text-gray-400">L</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Fuel Issued</p>
            </div>

            {/* Carry Forward Card */}
            <div className="bg-[#0f1325]/70 rounded-xl p-4 text-center border border-gray-700/50 hover:border-red-500/50 transition-colors">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-red-400" />
                <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">
                  CARRY FORWARD
                </p>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {fuelData.carryForward.toLocaleString()}{" "}
                <span className="text-xs font-normal text-gray-400">L</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Remaining Stock</p>
            </div>
          </div>

          {/* Simple progress / summary bar (optional) */}
          <div className="px-5 pb-5">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Target vs Dispersion</span>
              <span className="font-medium">
                {fuelData.target > 0
                  ? ((fuelData.dispersion / fuelData.target) * 100).toFixed(1)
                  : 0}
                % achieved
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${
                    fuelData.target > 0
                      ? (fuelData.dispersion / fuelData.target) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              <span>0%</span>
              <span>
                Carry Forward: {fuelData.carryForward.toLocaleString()} L
              </span>
              <span>100%</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FuelSummary;
