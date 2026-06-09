// src/pages/FuelManagementPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Zap,
  CheckCircle,
  Fuel,
  TrendingDown,
  TrendingUp,
  Calendar,
  Target,
  Droplet,
  AlertCircle,
} from "lucide-react";
import SideBar from "../components/SideBar";
import TopBar from "../components/TopBar";
import { fetchGoogleSheetData } from "/backend/GoogleSheetApi";
import FuelSummary from "../components/FuelSummary";
import FuelDispersion from "../components/FuelDispersion";

const FuelManagementPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Navigation handlers
  const goToDashboard = () => navigate("/dashboard");
  const goToMap = () => navigate("/map");
  const goToRIFDashboard = () => navigate("/rif-dashboard");
  const goToDGAutoCheck = () => navigate("/dg-auto-check");
  const goToFuelManagement = () => {};

  const navItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      active: false,
      onClick: goToDashboard,
    },
    {
      name: "Fuel Performance",
      icon: Fuel,
      active: true,
      onClick: goToFuelManagement,
    },
    {
      name: "DG Auto Check",
      icon: CheckCircle,
      active: false,
      onClick: goToDGAutoCheck,
    },
    { name: "Sites Map", icon: Map, active: false, onClick: goToMap },
    { name: "RIF Alarms", icon: Zap, active: false, onClick: goToRIFDashboard },
  ];

  // Fuel Summary state
  const [fuelRows, setFuelRows] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedFuelData, setSelectedFuelData] = useState({
    target: 0,
    dispersion: 0,
    carryForward: 0,
  });
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isLoadingFuel, setIsLoadingFuel] = useState(true);

  // Fuel Dispersion state
  const [dispersionData, setDispersionData] = useState([]);
  const [isLoadingDispersion, setIsLoadingDispersion] = useState(true);

  // Fuel Savings state
  const [fuelSavings, setFuelSavings] = useState(null);

  // YTD Summary state
  const [ytdSummary, setYtdSummary] = useState({
    totalTarget: 0,
    dispersedUpToMay: 0,
    remaining: 0,
  });

  // Helper: convert short month name to full month
  const shortToFullMonth = (short) => {
    const map = {
      Jan: "January",
      Feb: "February",
      Mar: "March",
      Apr: "April",
      May: "May",
      Jun: "June",
      Jul: "July",
      Aug: "August",
      Sep: "September",
      Oct: "October",
      Nov: "November",
      Dec: "December",
    };
    return map[short] || null;
  };

  // Calculate YTD summary (total target, dispersed up to May, remaining)
  const calculateYtdSummary = (rows) => {
    if (!rows.length)
      return { totalTarget: 0, dispersedUpToMay: 0, remaining: 0 };

    let totalTarget = 0;
    let dispersedUpToMay = 0;
    const monthsUpToMay = ["Jan-26", "Feb-26", "Mar-26", "Apr-26", "May-26"];

    rows.forEach((row) => {
      const month = row[0]?.toString().trim();
      const target = parseFloat(row[1]) || 0;
      const dispersion = parseFloat(row[2]) || 0;

      totalTarget += target;
      if (monthsUpToMay.includes(month)) {
        dispersedUpToMay += dispersion;
      }
    });

    const remaining = totalTarget - dispersedUpToMay;
    return { totalTarget, dispersedUpToMay, remaining };
  };

  // Update YTD summary when fuelRows changes
  useEffect(() => {
    if (fuelRows.length > 0) {
      const summary = calculateYtdSummary(fuelRows);
      setYtdSummary(summary);
    }
  }, [fuelRows]);

  // Calculate fuel savings when selected month changes
  useEffect(() => {
    if (!selectedMonth || dispersionData.length === 0) {
      setFuelSavings(null);
      return;
    }

    const shortMonth = selectedMonth.split("-")[0];
    const fullMonth = shortToFullMonth(shortMonth);
    if (!fullMonth) {
      setFuelSavings(null);
      return;
    }

    const monthData = dispersionData.find(
      (item) => item.month.toLowerCase() === fullMonth.toLowerCase(),
    );

    if (monthData) {
      const diff = monthData.y26 - monthData.y25;
      setFuelSavings({
        diff: diff,
        isNegative: diff < 0,
        y25: monthData.y25,
        y26: monthData.y26,
      });
    } else {
      setFuelSavings(null);
    }
  }, [selectedMonth, dispersionData]);

  // Load Fuel Summary data
  const loadFuelSummary = async () => {
    setIsLoadingFuel(true);
    try {
      const rows = await fetchGoogleSheetData("Fuel Summary", "A:D");
      if (!rows || rows.length < 2) throw new Error("No fuel summary data");
      const dataRows = rows.slice(1);
      setFuelRows(dataRows);
      const months = dataRows
        .map((row) => row[0]?.toString().trim())
        .filter((m) => m);
      setAvailableMonths(months);

      if (months.length > 0) {
        const defaultMonth = months.includes("June-26") ? "June-26" : months[0];
        setSelectedMonth(defaultMonth);
      }
    } catch (error) {
      console.error("Failed to fetch Fuel Summary data:", error);
      setFuelRows([]);
      setAvailableMonths([]);
    } finally {
      setIsLoadingFuel(false);
    }
  };

  // Update selected fuel data when month changes
  useEffect(() => {
    if (!selectedMonth || fuelRows.length === 0) return;
    const row = fuelRows.find((r) => r[0]?.toString().trim() === selectedMonth);
    if (row) {
      setSelectedFuelData({
        target: parseFloat(row[1]) || 0,
        dispersion: parseFloat(row[2]) || 0,
        carryForward: parseFloat(row[3]) || 0,
      });
    } else {
      setSelectedFuelData({ target: 0, dispersion: 0, carryForward: 0 });
    }
  }, [selectedMonth, fuelRows]);

  // Load Fuel Dispersion data
  const loadFuelDispersion = async () => {
    setIsLoadingDispersion(true);
    try {
      const rows = await fetchGoogleSheetData("Fuel Dispersion", "A:C");
      if (!rows || rows.length < 2) throw new Error("No dispersion data");
      const dataRows = rows.slice(1);
      const parsed = dataRows
        .filter((row) => row[0] && row[0].toString().trim() !== "")
        .map((row) => ({
          month: row[0].toString().trim(),
          y25: parseFloat(row[1]) || 0,
          y26: parseFloat(row[2]) || 0,
        }));
      setDispersionData(parsed);
    } catch (error) {
      console.error("Failed to fetch Fuel Dispersion data:", error);
      setDispersionData([]);
    } finally {
      setIsLoadingDispersion(false);
    }
  };

  // Format number in Lakh (1 Lakh = 100,000) with 2 decimals
  const formatInLakh = (num) => {
    const lakh = num / 100000;
    return lakh.toFixed(2);
  };

  // Format raw liters with commas
  const formatLiters = (num) => {
    return num.toLocaleString("en-IN");
  };

  // Initial data fetch
  useEffect(() => {
    loadFuelSummary();
    loadFuelDispersion();
  }, []);

  return (
    <div className="h-screen bg-[#0f1325] text-white flex overflow-hidden">
      <SideBar navItems={navItems} sidebarOpen={sidebarOpen} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={toggleSidebar} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5">
          {/* Header section */}
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Fuel Management</h1>

              {/* Fuel Savings Badge */}
              {!isLoadingDispersion && fuelSavings !== null && (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                    fuelSavings.isNegative
                      ? "bg-red-500/10 border-red-500/50 text-red-400"
                      : "bg-green-500/10 border-green-500/50 text-green-400"
                  } animate-pulse`}
                >
                  {fuelSavings.isNegative ? (
                    <TrendingDown size={18} />
                  ) : (
                    <TrendingUp size={18} />
                  )}
                  <span className="text-sm font-semibold">Fuel Savings</span>
                  <span className="text-lg font-bold">
                    {fuelSavings.diff > 0 ? "+" : ""}
                    {fuelSavings.diff.toLocaleString()} L
                  </span>
                  <span className="text-xs opacity-70">(2026 vs 2025)</span>
                </div>
              )}

              {!isLoadingDispersion &&
                fuelSavings === null &&
                dispersionData.length > 0 &&
                selectedMonth && (
                  <div className="text-xs text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full">
                    ⚠️ No data for {selectedMonth}
                  </div>
                )}

              {isLoadingDispersion && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="text-sm text-gray-400">
                    Loading savings...
                  </span>
                </div>
              )}
            </div>

            {/* YTD Summary Card - Styled beautifully */}
            {!isLoadingFuel && ytdSummary.totalTarget > 0 && (
              <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1225] rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
                {/* Card Header */}
                <div className="px-5 pt-4 pb-2 border-b border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-blue-400" />
                    <h2 className="text-md font-semibold tracking-wide text-gray-200">
                      YTD SUMMARY
                    </h2>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Year‑to‑Date Fuel Performance (till May 2026)
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Target */}
                  <div className="bg-[#0f1325]/50 rounded-xl p-4 text-center border border-gray-700/30 hover:border-blue-500/40 transition-all">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Target size={16} className="text-blue-400" />
                      <p className="text-gray-300 text-xs uppercase tracking-wider">
                        Y‑26 Target
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {formatInLakh(ytdSummary.totalTarget)} Lakh
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ({formatLiters(ytdSummary.totalTarget)} L)
                    </p>
                  </div>

                  {/* Dispersed till May */}
                  <div className="bg-[#0f1325]/50 rounded-xl p-4 text-center border border-gray-700/30 hover:border-green-500/40 transition-all">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Droplet size={16} className="text-green-400" />
                      <p className="text-gray-300 text-xs uppercase tracking-wider">
                        Dispersed till May
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-400">
                      {formatInLakh(ytdSummary.dispersedUpToMay)} Lakh
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ({formatLiters(ytdSummary.dispersedUpToMay)} L)
                    </p>
                  </div>

                  {/* Remaining Fuel */}
                  <div className="bg-[#0f1325]/50 rounded-xl p-4 text-center border border-gray-700/30 hover:border-amber-500/40 transition-all">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-amber-400" />
                      <p className="text-gray-300 text-xs uppercase tracking-wider">
                        Remaining Fuel
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      {formatInLakh(ytdSummary.remaining)} Lakh
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ({formatLiters(ytdSummary.remaining)} L)
                    </p>
                  </div>
                </div>

                {/* Optional: Progress bar for remaining */}
                <div className="px-5 pb-5">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Remaining Target</span>
                    <span>
                      {(
                        (ytdSummary.remaining / ytdSummary.totalTarget) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${(ytdSummary.remaining / ytdSummary.totalTarget) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fuel Summary Component */}
          <FuelSummary
            selectedMonth={selectedMonth}
            availableMonths={availableMonths}
            onMonthChange={setSelectedMonth}
            fuelData={selectedFuelData}
            isLoading={isLoadingFuel}
          />

          {/* Fuel Dispersion Component */}
          <FuelDispersion
            data={dispersionData}
            isLoading={isLoadingDispersion}
          />
        </div>
      </main>
    </div>
  );
};

export default FuelManagementPage;
