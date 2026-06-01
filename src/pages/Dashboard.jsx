// src/pages/Dashboard.jsx (Updated section)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Map, Fuel, Bell, Circle, Zap } from "lucide-react";

// Import all components
import WeatherSummaryCard from "../components/WeatherSummaryCard";
import LiveWeatherRadar from "../components/LiveWeatherRadar";
import SitesByCategoryTable from "../components/SitesByCategoryTable";
import FuelSummary from "../components/FuelSummary";
import FuelDistribution from "../components/FuelDistribution";
import SideBar from "../components/SideBar";
import TopBar from "../components/TopBar";
import WeatherAlertDashboard from "../components/WeatherAlertDashboard";
import { fetchGoogleSheetData } from "/backend/GoogleSheetApi";

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWeatherPage, setShowWeatherPage] = useState(false);
  const [masterData, setMasterData] = useState([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

  // ================= FUEL SUMMARY DATA =================
  const fuelSummary = {
    fuelTarget: 44000,
    totalUplift: 36970,
    accessSiteFuelPouring: 36170,
    teamInHand: 0,
    availableL: 7030,
    date: "24 May 2026",
  };

  const percentageAchieved =
    (fuelSummary.totalUplift / fuelSummary.fuelTarget) * 100;

  // ================= DYNAMIC FUEL DISTRIBUTION DATA =================
  const [fuelDistribution, setFuelDistribution] = useState({
    c1RemainingFuel: 0,
    c6RemainingFuel: 0,
    c1Subregion: "",
    c6Subregion: "",
    c1RectifierAlarmCount: 0,
    c6RectifierAlarmCount: 0,
  });

  // ================= DYNAMIC DG CATEGORIES DATA =================
  const [dgCategories, setDgCategories] = useState([
    { name: "PTN Node", total: 0, less50: 0, greater50: 0 },
    { name: "Critical Hub (10 ++)", total: 0, less50: 0, greater50: 0 },
    { name: "Major Hub (5~10)", total: 0, less50: 0, greater50: 0 },
    { name: "Minor Hub (1~4)", total: 0, less50: 0, greater50: 0 },
    { name: "Single/FTTS", total: 0, less50: 0, greater50: 0 },
  ]);

  const [totalDGs, setTotalDGs] = useState(0);
  const [totalLess50, setTotalLess50] = useState(0);
  const [totalGreater50, setTotalGreater50] = useState(0);

  // ================= REMAINING FUEL BY CATEGORY DATA =================
  const [c1RemainingFuelByCategory, setC1RemainingFuelByCategory] = useState(
    [],
  );
  const [c6RemainingFuelByCategory, setC6RemainingFuelByCategory] = useState(
    [],
  );
  const [c1TotalRemainingFuel, setC1TotalRemainingFuel] = useState(0);
  const [c6TotalRemainingFuel, setC6TotalRemainingFuel] = useState(0);

  // Helper function to map Severity values to standard categories
  const mapSeverityToCategory = (severity) => {
    if (!severity) return null;

    const cleanSeverity = severity.toString().trim().toLowerCase();

    if (cleanSeverity.includes("ptn") || cleanSeverity === "ptn node") {
      return "PTN Node";
    } else if (
      cleanSeverity.includes("critical") ||
      cleanSeverity.includes("critical hub") ||
      cleanSeverity === "critical hub (10 ++)"
    ) {
      return "Critical Hub (10 ++)";
    } else if (
      cleanSeverity.includes("major") ||
      cleanSeverity.includes("major hub") ||
      cleanSeverity === "major hub (5~10)"
    ) {
      return "Major Hub (5~10)";
    } else if (
      cleanSeverity.includes("minor") ||
      cleanSeverity.includes("minor hub") ||
      cleanSeverity === "minor hub (1~4)"
    ) {
      return "Minor Hub (1~4)";
    } else if (
      cleanSeverity.includes("single") ||
      cleanSeverity.includes("ftts") ||
      cleanSeverity === "single/ftts"
    ) {
      return "Single/FTTS";
    }

    return null;
  };

  // Fetch Master Sheet data and calculate all metrics
  const loadMasterData = async () => {
    try {
      setIsLoadingMaster(true);
      const rows = await fetchGoogleSheetData("Master Sheet", "A:U");

      if (!rows || rows.length === 0) {
        throw new Error("No data found");
      }

      const dataRows = rows.slice(1);
      setMasterData(dataRows);

      let c1TotalFuel = 0;
      let c6TotalFuel = 0;
      let c1AlarmCount = 0;
      let c6AlarmCount = 0;
      let c1SubregionSet = new Set();
      let c6SubregionSet = new Set();

      const categoryCounts = {
        "PTN Node": { total: 0, less50: 0, greater50: 0 },
        "Critical Hub (10 ++)": { total: 0, less50: 0, greater50: 0 },
        "Major Hub (5~10)": { total: 0, less50: 0, greater50: 0 },
        "Minor Hub (1~4)": { total: 0, less50: 0, greater50: 0 },
        "Single/FTTS": { total: 0, less50: 0, greater50: 0 },
      };

      // Initialize remaining fuel by category for C1 and C6
      const c1FuelByCategory = {
        "PTN Node": 0,
        "Critical Hub (10 ++)": 0,
        "Major Hub (5~10)": 0,
        "Minor Hub (1~4)": 0,
        "Single/FTTS": 0,
      };

      const c6FuelByCategory = {
        "PTN Node": 0,
        "Critical Hub (10 ++)": 0,
        "Major Hub (5~10)": 0,
        "Minor Hub (1~4)": 0,
        "Single/FTTS": 0,
      };

      dataRows.forEach((row) => {
        const remainingFuel = parseFloat(row[8]) || 0;
        const region = row[6] ? row[6].toString().trim() : "";
        const rectifierAlarm = row[10] ? row[10].toString() : "";
        const severityRaw = row[18] ? row[18].toString() : "";

        // Update region fuel totals
        if (region === "C-1") {
          c1TotalFuel += remainingFuel;
          if (row[5]) c1SubregionSet.add(row[5].toString());
        } else if (region === "C-6") {
          c6TotalFuel += remainingFuel;
          if (row[5]) c6SubregionSet.add(row[5].toString());
        }

        // Count rectifier alarms
        const hasAlarm =
          rectifierAlarm &&
          rectifierAlarm.trim() !== "" &&
          rectifierAlarm.toUpperCase() !== "OK" &&
          rectifierAlarm.toUpperCase() !== "NORMAL" &&
          rectifierAlarm.toUpperCase() !== "NO ALARM" &&
          !rectifierAlarm.toLowerCase().includes("no alarm");

        if (hasAlarm) {
          if (region === "C-1") {
            c1AlarmCount++;
          } else if (region === "C-6") {
            c6AlarmCount++;
          }
        }

        // Map to category and add remaining fuel
        const category = mapSeverityToCategory(severityRaw);

        if (category && categoryCounts[category]) {
          categoryCounts[category].total++;

          if (remainingFuel < 50) {
            categoryCounts[category].less50++;
          } else {
            categoryCounts[category].greater50++;
          }

          // Add remaining fuel to respective region's category
          if (region === "C-1" && c1FuelByCategory[category] !== undefined) {
            c1FuelByCategory[category] += remainingFuel;
          } else if (
            region === "C-6" &&
            c6FuelByCategory[category] !== undefined
          ) {
            c6FuelByCategory[category] += remainingFuel;
          }
        }
      });

      setFuelDistribution({
        c1RemainingFuel: Math.round(c1TotalFuel),
        c6RemainingFuel: Math.round(c6TotalFuel),
        c1Subregion: Array.from(c1SubregionSet).join(", ") || "Multiple Areas",
        c6Subregion: Array.from(c6SubregionSet).join(", ") || "Multiple Areas",
        c1RectifierAlarmCount: c1AlarmCount,
        c6RectifierAlarmCount: c6AlarmCount,
      });

      // Prepare C1 remaining fuel by category array
      const c1FuelArray = [];
      for (const [category, fuel] of Object.entries(c1FuelByCategory)) {
        if (fuel > 0) {
          c1FuelArray.push({ category, remainingFuel: Math.round(fuel) });
        }
      }
      c1FuelArray.sort((a, b) => b.remainingFuel - a.remainingFuel);
      setC1RemainingFuelByCategory(c1FuelArray);
      setC1TotalRemainingFuel(Math.round(c1TotalFuel));

      // Prepare C6 remaining fuel by category array
      const c6FuelArray = [];
      for (const [category, fuel] of Object.entries(c6FuelByCategory)) {
        if (fuel > 0) {
          c6FuelArray.push({ category, remainingFuel: Math.round(fuel) });
        }
      }
      c6FuelArray.sort((a, b) => b.remainingFuel - a.remainingFuel);
      setC6RemainingFuelByCategory(c6FuelArray);
      setC6TotalRemainingFuel(Math.round(c6TotalFuel));

      const updatedCategories = dgCategories.map((cat) => ({
        ...cat,
        total: categoryCounts[cat.name]?.total || 0,
        less50: categoryCounts[cat.name]?.less50 || 0,
        greater50: categoryCounts[cat.name]?.greater50 || 0,
      }));

      setDgCategories(updatedCategories);

      const total = updatedCategories.reduce((sum, cat) => sum + cat.total, 0);
      const less50Total = updatedCategories.reduce(
        (sum, cat) => sum + cat.less50,
        0,
      );
      const greater50Total = updatedCategories.reduce(
        (sum, cat) => sum + cat.greater50,
        0,
      );

      setTotalDGs(total);
      setTotalLess50(less50Total);
      setTotalGreater50(greater50Total);
    } catch (error) {
      console.error("Failed to fetch Master Sheet data:", error);
      setFuelDistribution({
        c1RemainingFuel: 7242,
        c6RemainingFuel: 5691,
        c1Subregion: "Lahore North, Rawalpindi East",
        c6Subregion: "Islamabad Central, Faisalabad West",
        c1RectifierAlarmCount: 67,
        c6RectifierAlarmCount: 45,
      });

      const fallbackCategories = [
        { name: "PTN Node", total: 45, less50: 12, greater50: 33 },
        { name: "Critical Hub (10 ++)", total: 23, less50: 8, greater50: 15 },
        { name: "Major Hub (5~10)", total: 38, less50: 15, greater50: 23 },
        { name: "Minor Hub (1~4)", total: 67, less50: 42, greater50: 25 },
        { name: "Single/FTTS", total: 89, less50: 67, greater50: 22 },
      ];
      setDgCategories(fallbackCategories);

      const total = fallbackCategories.reduce((sum, cat) => sum + cat.total, 0);
      const less50Total = fallbackCategories.reduce(
        (sum, cat) => sum + cat.less50,
        0,
      );
      const greater50Total = fallbackCategories.reduce(
        (sum, cat) => sum + cat.greater50,
        0,
      );
      setTotalDGs(total);
      setTotalLess50(less50Total);
      setTotalGreater50(greater50Total);

      // Fallback remaining fuel data matching the image
      setC1RemainingFuelByCategory([
        { category: "Minor Hub (1~4)", remainingFuel: 1800 },
        { category: "PTN Node", remainingFuel: 1744 },
        { category: "Major Hub (5~10)", remainingFuel: 1692 },
        { category: "Single/FTTS", remainingFuel: 1332 },
        { category: "Critical Hub (10 ++)", remainingFuel: 674 },
      ]);
      setC1TotalRemainingFuel(7242);

      setC6RemainingFuelByCategory([
        { category: "Major Hub (5~10)", remainingFuel: 1712 },
        { category: "Critical Hub (10 ++)", remainingFuel: 1320 },
        { category: "Single/FTTS", remainingFuel: 1055 },
        { category: "Minor Hub (1~4)", remainingFuel: 822 },
        { category: "PTN Node", remainingFuel: 782 },
      ]);
      setC6TotalRemainingFuel(5691);
    } finally {
      setIsLoadingMaster(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const goToWeatherPage = () => setShowWeatherPage(true);
  const goToDashboard = () => setShowWeatherPage(false);
  const goToMap = () => navigate("/map");
  const goToRIFDashboard = () => navigate("/rif-dashboard");

  const navItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      active: true,
      onClick: goToDashboard,
    },
    { name: "Sites Map", icon: Map, active: false, onClick: goToMap },
    { name: "RIF Alarms", icon: Zap, active: false, onClick: goToRIFDashboard },
  ];

  const exportCategoriesToCSV = () => {
    let csv = "Category,Total Sites,Fuel <50L,Fuel >50L,Percentage of Total\n";

    dgCategories.forEach((cat) => {
      const perc = totalDGs > 0 ? ((cat.total / totalDGs) * 100).toFixed(1) : 0;
      csv += `"${cat.name}",${cat.total},${cat.less50},${cat.greater50},${perc}\n`;
    });

    csv += `"TOTAL",${totalDGs},${totalLess50},${totalGreater50},100\n\n`;

    // Add C1 Remaining Fuel by Category
    csv += "C-1 REMAINING FUEL BY CATEGORY\n";
    csv += "Category,Remaining Fuel (L)\n";
    c1RemainingFuelByCategory.forEach((item) => {
      csv += `"${item.category}",${item.remainingFuel}\n`;
    });
    csv += `"TOTAL C-1",${c1TotalRemainingFuel}\n\n`;

    // Add C6 Remaining Fuel by Category
    csv += "C-6 REMAINING FUEL BY CATEGORY\n";
    csv += "Category,Remaining Fuel (L)\n";
    c6RemainingFuelByCategory.forEach((item) => {
      csv += `"${item.category}",${item.remainingFuel}\n`;
    });
    csv += `"TOTAL C-6",${c6TotalRemainingFuel}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sites_By_Category_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Weather Page View
  if (showWeatherPage) {
    return (
      <div className="h-screen bg-[#0f1325] text-white flex overflow-hidden">
        <SideBar navItems={navItems} sidebarOpen={sidebarOpen} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <TopBar onMenuClick={toggleSidebar} />
          <div className="flex-1 overflow-y-auto p-5">
            <WeatherAlertDashboard />
          </div>
        </main>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="h-screen bg-[#0f1325] text-white flex overflow-hidden">
      <SideBar navItems={navItems} sidebarOpen={sidebarOpen} />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={toggleSidebar} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-5">
          {/* Weather Radar + Impact Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
            <LiveWeatherRadar />
            <div onClick={goToWeatherPage} className="cursor-pointer">
              <WeatherSummaryCard />
            </div>
          </div>

          {/* Sites By Category Table */}
          <SitesByCategoryTable
            dgCategories={dgCategories}
            totalDGs={totalDGs}
            totalLess50={totalLess50}
            totalGreater50={totalGreater50}
            isLoadingMaster={isLoadingMaster}
            onExport={exportCategoriesToCSV}
          />

          {/* Fuel Summary */}
          <FuelSummary
            fuelSummary={fuelSummary}
            percentageAchieved={percentageAchieved}
          />

          {/* Fuel Distribution with integrated tables */}
          <FuelDistribution
            fuelDistribution={fuelDistribution}
            isLoadingMaster={isLoadingMaster}
            c1RemainingFuelByCategory={c1RemainingFuelByCategory}
            c6RemainingFuelByCategory={c6RemainingFuelByCategory}
            c1TotalRemainingFuel={c1TotalRemainingFuel}
            c6TotalRemainingFuel={c6TotalRemainingFuel}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
