// src/components/FuelDistribution.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  Fuel,
  TrendingUp,
  Package,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const FuelDistribution = ({
  fuelDistribution,
  isLoadingMaster,
  c1RemainingFuelByCategory,
  c6RemainingFuelByCategory,
  c1TotalRemainingFuel,
  c6TotalRemainingFuel,
}) => {
  // State for toggling tables
  const [isC1TableOpen, setIsC1TableOpen] = useState(false);
  const [isC6TableOpen, setIsC6TableOpen] = useState(false);
  const [c1TableHeight, setC1TableHeight] = useState(0);
  const [c6TableHeight, setC6TableHeight] = useState(0);

  const c1TableRef = useRef(null);
  const c6TableRef = useRef(null);

  // Calculate total fuel
  const totalFuel =
    (fuelDistribution.c1RemainingFuel || 0) +
    (fuelDistribution.c6RemainingFuel || 0);
  const c1Percentage =
    totalFuel > 0
      ? ((fuelDistribution.c1RemainingFuel / totalFuel) * 100).toFixed(1)
      : 0;
  const c6Percentage =
    totalFuel > 0
      ? ((fuelDistribution.c6RemainingFuel / totalFuel) * 100).toFixed(1)
      : 0;

  // Measure table heights when content changes
  useEffect(() => {
    if (c1TableRef.current) {
      setC1TableHeight(c1TableRef.current.scrollHeight);
    }
    if (c6TableRef.current) {
      setC6TableHeight(c6TableRef.current.scrollHeight);
    }
  }, [c1RemainingFuelByCategory, c6RemainingFuelByCategory]);

  // Helper function to get category color
  const getCategoryColor = (category) => {
    if (category === "PTN Node") return "text-cyan-400";
    if (category === "Critical Hub (10 ++)") return "text-red-400";
    if (category === "Major Hub (5~10)") return "text-orange-400";
    if (category === "Minor Hub (1~4)") return "text-yellow-400";
    if (category === "Single/FTTS") return "text-gray-400";
    return "text-gray-300";
  };

  // Helper function to get percentage
  const getPercentage = (fuel, total) => {
    if (total === 0) return 0;
    return ((fuel / total) * 100).toFixed(1);
  };

  // Check for low fuel notifications
  const hasLowFuelInC1 =
    !isLoadingMaster &&
    c1RemainingFuelByCategory.some((item) => item.remainingFuel < 500);
  const hasLowFuelInC6 =
    !isLoadingMaster &&
    c6RemainingFuelByCategory.some((item) => item.remainingFuel < 500);
  const isC1LowRegion =
    !isLoadingMaster && fuelDistribution.c1RemainingFuel < 2000;
  const isC6LowRegion =
    !isLoadingMaster && fuelDistribution.c6RemainingFuel < 2000;

  // Notification badge component
  const NotificationBadge = ({ count }) => {
    if (count === 0) return null;
    return (
      <div className="absolute -top-1 -right-1 bg-red-500 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white animate-pulse shadow-lg">
        {count}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col">
      {/* Header - Fixed */}
      <div className="bg-[#0a0f20] px-5 py-3 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <BarChart3 size={18} className="text-cyan-400" />
            FUEL STOCK
          </h3>
          <div className="relative">
            <Bell
              size={16}
              className="text-yellow-400 cursor-pointer hover:text-yellow-300 transition-colors"
            />
            {(hasLowFuelInC1 || hasLowFuelInC6) && (
              <NotificationBadge count={1} />
            )}
          </div>
        </div>
        <p className="text-gray-500 text-xs mt-1">Remaining Fuel by Region</p>
      </div>

      {/* Content - Dynamic height based on open state */}
      <div className="flex-1 flex flex-col">
        {/* C-1 Section */}
        <div className="border-b border-gray-700/50">
          {/* C-1 Card Header with toggle */}
          <div
            className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsC1TableOpen(!isC1TableOpen)}
          >
            <div className="bg-gradient-to-r from-blue-950/40 to-[#0f1325]/70 rounded-xl p-4 border-l-4 border-blue-500 relative">
              <div className="absolute top-2 right-2">
                {isC1TableOpen ? (
                  <ChevronUp size={16} className="text-blue-400" />
                ) : (
                  <ChevronDown size={16} className="text-blue-400" />
                )}
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500/20 p-1.5 rounded-lg relative">
                    <Fuel size={16} className="text-blue-400" />
                    {isC1LowRegion && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-gray-200 text-sm font-medium">
                    C-1 Region
                  </span>
                </div>
                {isLoadingMaster ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                ) : (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {fuelDistribution.c1RemainingFuel.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      Liters remaining
                    </span>
                  </div>
                )}
              </div>
              {!isLoadingMaster && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Usage</span>
                    <span>{c1Percentage}% of total</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${c1Percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* C-1 Table with smooth height transition */}
          <div
            className="transition-all duration-400 ease-in-out overflow-hidden"
            style={{
              maxHeight: isC1TableOpen ? `${c1TableHeight}px` : "0px",
              opacity: isC1TableOpen ? 1 : 0,
            }}
          >
            <div ref={c1TableRef}>
              {!isLoadingMaster &&
                c1RemainingFuelByCategory &&
                c1RemainingFuelByCategory.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="bg-[#0f1325]/50 rounded-xl overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-700 bg-blue-500/5">
                        <p className="text-xs font-medium text-blue-400">
                          Remaining Fuel by Site Category
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[#0f1325]">
                            <tr>
                              <th className="p-2 text-left text-gray-400 font-medium text-[10px]">
                                Category (Site Type)
                              </th>
                              <th className="p-2 text-right text-gray-400 font-medium text-[10px]">
                                Remaining Fuel (L)
                              </th>
                              <th className="p-2 text-right text-gray-400 font-medium text-[10px]">
                                % of Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {c1RemainingFuelByCategory.map((item, idx) => {
                              const percentage = getPercentage(
                                item.remainingFuel,
                                c1TotalRemainingFuel,
                              );
                              const isLowFuel = item.remainingFuel < 500;
                              return (
                                <tr
                                  key={idx}
                                  className={`hover:bg-blue-500/5 transition-colors ${isLowFuel ? "bg-red-500/5" : ""}`}
                                >
                                  <td className="p-2">
                                    <div className="flex items-center gap-1">
                                      <span
                                        className={`text-xs font-medium ${getCategoryColor(item.category)}`}
                                      >
                                        {item.category}
                                      </span>
                                      {isLowFuel && (
                                        <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded">
                                          Low
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-2 text-right">
                                    <span
                                      className={`text-xs font-mono ${isLowFuel ? "text-red-400 font-bold" : "text-white"}`}
                                    >
                                      {item.remainingFuel.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="p-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <div className="w-12 bg-gray-700 rounded-full h-1 overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1 rounded-full"
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-gray-400 w-8">
                                        {percentage}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-[#0f1325] border-t border-gray-700">
                            <tr>
                              <td className="p-2 text-white font-bold text-xs">
                                Total
                              </td>
                              <td className="p-2 text-right text-white font-bold text-xs">
                                {c1TotalRemainingFuel.toLocaleString()} L
                              </td>
                              <td className="p-2 text-right text-white font-bold text-xs">
                                100%
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* C-6 Section */}
        <div>
          {/* C-6 Card Header with toggle */}
          <div
            className="p-4 pt-2 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsC6TableOpen(!isC6TableOpen)}
          >
            <div className="bg-gradient-to-r from-purple-950/40 to-[#0f1325]/70 rounded-xl p-4 border-l-4 border-purple-500 relative">
              <div className="absolute top-2 right-2">
                {isC6TableOpen ? (
                  <ChevronUp size={16} className="text-purple-400" />
                ) : (
                  <ChevronDown size={16} className="text-purple-400" />
                )}
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-500/20 p-1.5 rounded-lg relative">
                    <Fuel size={16} className="text-purple-400" />
                    {isC6LowRegion && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-gray-200 text-sm font-medium">
                    C-6 Region
                  </span>
                </div>
                {isLoadingMaster ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                ) : (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {fuelDistribution.c6RemainingFuel.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      Liters remaining
                    </span>
                  </div>
                )}
              </div>
              {!isLoadingMaster && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Usage</span>
                    <span>{c6Percentage}% of total</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-400 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${c6Percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* C-6 Table with smooth height transition */}
          <div
            className="transition-all duration-400 ease-in-out overflow-hidden"
            style={{
              maxHeight: isC6TableOpen ? `${c6TableHeight}px` : "0px",
              opacity: isC6TableOpen ? 1 : 0,
            }}
          >
            <div ref={c6TableRef}>
              {!isLoadingMaster &&
                c6RemainingFuelByCategory &&
                c6RemainingFuelByCategory.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="bg-[#0f1325]/50 rounded-xl overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-700 bg-purple-500/5">
                        <p className="text-xs font-medium text-purple-400">
                          Remaining Fuel by Site Category
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-[#0f1325]">
                            <tr>
                              <th className="p-2 text-left text-gray-400 font-medium text-[10px]">
                                Category (Site Type)
                              </th>
                              <th className="p-2 text-right text-gray-400 font-medium text-[10px]">
                                Remaining Fuel (L)
                              </th>
                              <th className="p-2 text-right text-gray-400 font-medium text-[10px]">
                                % of Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {c6RemainingFuelByCategory.map((item, idx) => {
                              const percentage = getPercentage(
                                item.remainingFuel,
                                c6TotalRemainingFuel,
                              );
                              const isLowFuel = item.remainingFuel < 500;
                              return (
                                <tr
                                  key={idx}
                                  className={`hover:bg-purple-500/5 transition-colors ${isLowFuel ? "bg-red-500/5" : ""}`}
                                >
                                  <td className="p-2">
                                    <div className="flex items-center gap-1">
                                      <span
                                        className={`text-xs font-medium ${getCategoryColor(item.category)}`}
                                      >
                                        {item.category}
                                      </span>
                                      {isLowFuel && (
                                        <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded">
                                          Low
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-2 text-right">
                                    <span
                                      className={`text-xs font-mono ${isLowFuel ? "text-red-400 font-bold" : "text-white"}`}
                                    >
                                      {item.remainingFuel.toLocaleString()}
                                    </span>
                                  </td>
                                  <td className="p-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <div className="w-12 bg-gray-700 rounded-full h-1 overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-purple-500 to-pink-400 h-1 rounded-full"
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-gray-400 w-8">
                                        {percentage}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-[#0f1325] border-t border-gray-700">
                            <tr>
                              <td className="p-2 text-white font-bold text-xs">
                                Total
                              </td>
                              <td className="p-2 text-right text-white font-bold text-xs">
                                {c6TotalRemainingFuel.toLocaleString()} L
                              </td>
                              <td className="p-2 text-right text-white font-bold text-xs">
                                100%
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Total Fuel Summary - Always visible */}
        {!isLoadingMaster && totalFuel > 0 && (
          <div className="p-4 pt-2 border-t border-gray-700/50 mt-auto">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">
                Total Remaining Fuel
              </span>
              <span className="text-base font-bold text-cyan-400">
                {totalFuel.toLocaleString()} L
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuelDistribution;
