// src/components/FuelDispersion.jsx
import React from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

const FuelDispersion = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-400" />
            FUEL DISPERSION COMPARISON (2025 vs 2026)
          </h2>
        </div>
        <div className="p-8 text-center text-gray-400">
          <div className="animate-spin inline-block w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full mr-2"></div>
          Loading dispersion data...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-400" />
            FUEL DISPERSION COMPARISON (2025 vs 2026)
          </h2>
        </div>
        <div className="p-8 text-center text-gray-400">
          No dispersion data available.
        </div>
      </div>
    );
  }

  const getPercentChange = (y25, y26) => {
    if (y25 === 0) return y26 > 0 ? 100 : 0;
    return ((y26 - y25) / y25) * 100;
  };

  const getTrend = (change) => {
    if (change > 0) return { icon: TrendingUp, color: "text-green-400" };
    if (change < 0) return { icon: TrendingDown, color: "text-red-400" };
    return { icon: Minus, color: "text-gray-400" };
  };

  const maxValue = Math.max(...data.flatMap((item) => [item.y25, item.y26]));

  return (
    <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 size={20} className="text-purple-400" />
          FUEL DISPERSION COMPARISON (2025 vs 2026)
        </h2>
        <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full">
          Year over Year
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0f1325]">
            <tr className="border-b border-gray-800">
              <th className="p-3 text-left">Month</th>
              <th className="p-3 text-right">Year 2025 (L)</th>
              <th className="p-3 text-right">Year 2026 (L)</th>
              <th className="p-3 text-right">Change</th>
              <th className="p-3 text-left">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((item, idx) => {
              const change = getPercentChange(item.y25, item.y26);
              const TrendIcon = getTrend(change).icon;
              const trendColor = getTrend(change).color;
              const barWidth2025 = (item.y25 / maxValue) * 100;
              const barWidth2026 = (item.y26 / maxValue) * 100;

              return (
                <tr key={idx} className="hover:bg-[#1a213a] transition-colors">
                  <td className="p-3 font-medium text-white">{item.month}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <span className="font-mono">
                        {item.y25.toLocaleString()}
                      </span>
                      <div className="w-24 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${barWidth2025}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <span className="font-mono">
                        {item.y26.toLocaleString()}
                      </span>
                      <div className="w-24 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: `${barWidth2026}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span
                      className={
                        change > 0
                          ? "text-green-400"
                          : change < 0
                            ? "text-red-400"
                            : "text-gray-400"
                      }
                    >
                      {change > 0 ? "+" : ""}
                      {change.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3">
                    <TrendIcon size={18} className={trendColor} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-[#0f1325]/50 border-t border-gray-800 text-xs text-gray-400">
        * Bars are relative to the maximum monthly dispersion value across both
        years.
      </div>
    </div>
  );
};

export default FuelDispersion;
