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
  Gauge,
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

  // YTD Summary state – store both raw strings (for display) and parsed numbers (for progress bar)
  const [ytdData, setYtdData] = useState({
    totalTargetRaw: "",
    dispersedUpToMayRaw: "",
    remainingRaw: "",
    totalTargetNumeric: 0,
    dispersedUpToMayNumeric: 0,
    remainingNumeric: 0,
  });
  const [isLoadingYtd, setIsLoadingYtd] = useState(true);

  // May-26 Fuel Savings data (derived from fuelRows)
  const [maySavings, setMaySavings] = useState(null);

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

  // Parse a value like "593.2K" -> 593200, "1.2M" -> 1200000, "1234" -> 1234
  const parseMetricValue = (valueStr) => {
    if (!valueStr || typeof valueStr !== "string") return 0;
    const trimmed = valueStr.trim().toUpperCase();
    const numberPart = parseFloat(trimmed.replace(/[^0-9.-]/g, ""));
    if (isNaN(numberPart)) return 0;
    if (trimmed.endsWith("K")) return numberPart * 1000;
    if (trimmed.endsWith("M")) return numberPart * 1000000;
    return numberPart;
  };

  // Load YTD summary from Fuel Dispersion sheet, columns D:E
  const loadYtdFromSheet = async () => {
    setIsLoadingYtd(true);
    try {
      const rows = await fetchGoogleSheetData("Fuel Dispersion", "D:E");
      if (!rows || rows.length < 2) throw new Error("No YTD summary data");

      let targetRaw = "";
      let dispersedRaw = "";
      let remainingRaw = "";

      for (let i = 0; i < rows.length; i++) {
        const label = rows[i][0]?.toString().trim().toLowerCase();
        const valueRaw = rows[i][1]?.toString().trim() || "";
        if (label === "ytd target") {
          targetRaw = valueRaw;
        } else if (label === "dispersed till may") {
          dispersedRaw = valueRaw;
        } else if (label === "remaining fuel") {
          remainingRaw = valueRaw;
        }
      }

      if (!targetRaw && rows.length >= 2) {
        targetRaw = rows[1]?.[1]?.toString().trim() || "";
        dispersedRaw = rows[2]?.[1]?.toString().trim() || "";
        remainingRaw = rows[3]?.[1]?.toString().trim() || "";
      }

      const targetNum = parseMetricValue(targetRaw);
      const dispersedNum = parseMetricValue(dispersedRaw);
      const remainingNum = parseMetricValue(remainingRaw);

      setYtdData({
        totalTargetRaw: targetRaw,
        dispersedUpToMayRaw: dispersedRaw,
        remainingRaw: remainingRaw,
        totalTargetNumeric: targetNum,
        dispersedUpToMayNumeric: dispersedNum,
        remainingNumeric: remainingNum,
      });
    } catch (error) {
      console.error("Failed to fetch YTD summary:", error);
      setYtdData({
        totalTargetRaw: "",
        dispersedUpToMayRaw: "",
        remainingRaw: "",
        totalTargetNumeric: 0,
        dispersedUpToMayNumeric: 0,
        remainingNumeric: 0,
      });
    } finally {
      setIsLoadingYtd(false);
    }
  };

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

      // Extract May-26 data for the Fuel Savings section
      const mayRow = dataRows.find(
        (row) => row[0]?.toString().trim() === "May-26",
      );
      if (mayRow) {
        const target = parseFloat(mayRow[1]) || 0;
        const dispersion = parseFloat(mayRow[2]) || 0;
        const savings = target - dispersion; // positive = saved, negative = overshoot
        setMaySavings({ target, dispersion, savings });
      } else {
        setMaySavings(null);
      }
    } catch (error) {
      console.error("Failed to fetch Fuel Summary data:", error);
      setFuelRows([]);
      setAvailableMonths([]);
      setMaySavings(null);
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

  // Load Fuel Dispersion data (for chart)
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

  // Format raw liters with commas
  const formatLiters = (num) => {
    return num.toLocaleString("en-IN");
  };

  // Initial data fetch
  useEffect(() => {
    loadFuelSummary();
    loadFuelDispersion();
    loadYtdFromSheet();
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
              {/* Fuel Savings badge removed as requested */}
            </div>

            {/* YTD Summary Card */}
            {!isLoadingYtd && ytdData.totalTargetRaw && (
              <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1225] rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
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

                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0f1325]/50 rounded-xl p-4 text-center border border-gray-700/30 hover:border-blue-500/40 transition-all">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Target size={16} className="text-blue-400" />
                      <p className="text-gray-300 text-xs uppercase tracking-wider">
                        Y‑26 Target
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {ytdData.totalTargetRaw}
                    </p>
                  </div>

                  <div className="bg-[#0f1325]/50 rounded-xl p-4 text-center border border-gray-700/30 hover:border-green-500/40 transition-all">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Droplet size={16} className="text-green-400" />
                      <p className="text-gray-300 text-xs uppercase tracking-wider">
                        Dispersed till May
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-400">
                      {ytdData.dispersedUpToMayRaw}
                    </p>
                  </div>

                  <div className="bg-[#0f1325]/50 rounded-xl p-4 text-center border border-gray-700/30 hover:border-amber-500/40 transition-all">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-amber-400" />
                      <p className="text-gray-300 text-xs uppercase tracking-wider">
                        Remaining Fuel
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      {ytdData.remainingRaw}
                    </p>
                  </div>
                </div>

                {ytdData.totalTargetNumeric > 0 && (
                  <div className="px-5 pb-5">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Remaining Target</span>
                      <span>
                        {(
                          (ytdData.remainingNumeric /
                            ytdData.totalTargetNumeric) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-700"
                        style={{
                          width: `${(ytdData.remainingNumeric / ytdData.totalTargetNumeric) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {isLoadingYtd && (
              <div className="bg-[#1a1f3a] rounded-2xl border border-gray-700 p-6 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Loading YTD summary...</p>
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

          {/* NEW: Fuel Savings Section for May-26 */}
          {!isLoadingFuel && maySavings && (
            <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1225] rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
              <div className="px-5 pt-4 pb-2 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                  <Gauge size={18} className="text-emerald-400" />
                  <h2 className="text-md font-semibold tracking-wide text-gray-200">
                    Fuel Savings Via Portal – May 2026
                  </h2>
                </div>
                <p className="text-gray-400 text-xs mt-0.5">
                  Performance vs monthly target
                </p>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Target */}
                <div className="bg-[#0f1325]/50 rounded-xl p-4 text-center border border-gray-700/30 hover:border-blue-500/40 transition-all">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target size={16} className="text-blue-400" />
                    <p className="text-gray-300 text-xs uppercase tracking-wider">
                      Monthly Target
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatLiters(maySavings.target)} L
                  </p>
                </div>

                {/* Dispersion */}
                <div className="bg-[#0f1325]/50 rounded-xl p-4 text-center border border-gray-700/30 hover:border-purple-500/40 transition-all">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Droplet size={16} className="text-purple-400" />
                    <p className="text-gray-300 text-xs uppercase tracking-wider">
                      Actual Dispersion
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">
                    {formatLiters(maySavings.dispersion)} L
                  </p>
                </div>

                {/* Fuel Savings (Target - Dispersion) */}
                <div className="bg-[#0f1325]/50 rounded-xl p-4 text-center border border-gray-700/30 hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {maySavings.savings >= 0 ? (
                      <TrendingUp size={16} className="text-emerald-400" />
                    ) : (
                      <TrendingDown size={16} className="text-red-400" />
                    )}
                    <p className="text-gray-300 text-xs uppercase tracking-wider">
                      Fuel Savings
                    </p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      maySavings.savings >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {maySavings.savings >= 0 ? "+" : ""}
                    {formatLiters(Math.abs(maySavings.savings))} L
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {maySavings.savings >= 0
                      ? "Saved vs target"
                      : "Overshoot vs target"}
                  </p>
                </div>
              </div>
            </div>
          )}

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
