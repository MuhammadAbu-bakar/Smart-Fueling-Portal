// src/pages/FuelManagementPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Map, Zap, CheckCircle, Fuel } from "lucide-react";
import SideBar from "../components/SideBar";
import TopBar from "../components/TopBar";
import { fetchGoogleSheetData } from "/backend/GoogleSheetApi";
import FuelSummary from "../components/FuelSummary";
import FuelDispersion from "../components/FuelDispersion";

const FuelManagementPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Navigation for sidebar
  const goToDashboard = () => navigate("/dashboard");
  const goToMap = () => navigate("/map");
  const goToRIFDashboard = () => navigate("/rif-dashboard");
  const goToDGAutoCheck = () => navigate("/dg-auto-check");
  const goToFuelManagement = () => {}; // stays here

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

  // ========== Fuel Summary State ==========
  const [fuelRows, setFuelRows] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedFuelData, setSelectedFuelData] = useState({
    target: 0,
    dispersion: 0,
    carryForward: 0,
  });
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isLoadingFuel, setIsLoadingFuel] = useState(true);

  // ========== Fuel Dispersion State ==========
  const [dispersionData, setDispersionData] = useState([]);
  const [isLoadingDispersion, setIsLoadingDispersion] = useState(true);

  // Fetch Fuel Summary data (same as in Dashboard)
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
      if (months.length > 0) setSelectedMonth(months[0]);
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

  // Fetch Fuel Dispersion data
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
          <h1 className="text-2xl font-bold text-white mb-2">
            Fuel Management
          </h1>

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
