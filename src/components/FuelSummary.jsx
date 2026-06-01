// src/components/FuelSummary.jsx
import React from "react";
import { Package, Fuel, TrendingUp, Truck, AlertTriangle } from "lucide-react";

const FuelSummary = ({ fuelSummary, percentageAchieved }) => {
  return (
    <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package size={20} className="text-blue-400" />
            FUEL SUMMARY
          </h2>
          <p className="text-gray-400 text-xs">As of {fuelSummary.date}</p>
        </div>
        <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full">
          Monthly Report
        </span>
      </div>
      <div className="p-5 pt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0f1325]/70 rounded-xl p-3 text-center border border-gray-700/50 hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Fuel size={14} className="text-gray-400" />
            <p className="text-gray-400 text-[10px] uppercase tracking-wide">FUEL TARGET</p>
          </div>
          <p className="text-xl font-bold text-white">{fuelSummary.fuelTarget.toLocaleString()} <span className="text-xs font-normal text-gray-400">L</span></p>
          <p className="text-[10px] text-gray-500">Monthly Target</p>
        </div>
        <div className="bg-[#0f1325]/70 rounded-xl p-3 text-center border border-gray-700/50 hover:border-green-500/50 transition-colors">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={14} className="text-green-400" />
            <p className="text-gray-400 text-[10px] uppercase tracking-wide">TOTAL UPLIFT</p>
          </div>
          <p className="text-xl font-bold text-green-400">{fuelSummary.totalUplift.toLocaleString()} <span className="text-xs font-normal text-gray-400">L</span></p>
          <p className="text-[10px] text-green-400">{percentageAchieved.toFixed(1)}% of Target</p>
        </div>
        <div className="bg-[#0f1325]/70 rounded-xl p-3 text-center border border-gray-700/50 hover:border-blue-400/50 transition-colors">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Truck size={14} className="text-blue-400" />
            <p className="text-gray-400 text-[10px] uppercase tracking-wide">SITE FUEL POURING</p>
          </div>
          <p className="text-xl font-bold text-white">{fuelSummary.accessSiteFuelPouring.toLocaleString()} <span className="text-xs font-normal text-gray-400">L</span></p>
          <p className="text-[10px] text-gray-400">Access Sites</p>
        </div>
        <div className="bg-[#0f1325]/70 rounded-xl p-3 text-center border border-red-500/30 hover:border-red-500/70 transition-colors">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle size={14} className="text-red-400" />
            <p className="text-gray-400 text-[10px] uppercase tracking-wide">REMAINING FUEL</p>
          </div>
          <p className="text-xl font-bold text-red-400">{fuelSummary.availableL.toLocaleString()} <span className="text-xs font-normal text-gray-400">L</span></p>
          <p className="text-[10px] text-red-300">Adequate Reserve</p>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress towards monthly target</span>
          <span className="font-medium">{percentageAchieved.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentageAchieved}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-2">
          <span>0%</span>
          <span>Remaining: {fuelSummary.availableL.toLocaleString()} L ({(100 - percentageAchieved).toFixed(1)}%)</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default FuelSummary;