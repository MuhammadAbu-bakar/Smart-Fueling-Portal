// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Map, Zap, CheckCircle } from "lucide-react";

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
  const [isLoadingFuel, setIsLoadingFuel] = useState(true);

  // ================= FUEL SUMMARY DATA (from sheet) =================
  const [fuelSummary, setFuelSummary] = useState({
    fuelTarget: 0,
    totalUplift: 0,
    accessSiteFuelPouring: 0,
    teamInHand: 0,
    availableL: 0,
    date: "",
  });
  const [percentageAchieved, setPercentageAchieved] = useState(0);

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
    if (cleanSeverity.includes("ptn") || cleanSeverity === "ptn node")
      return "PTN Node";
    if (
      cleanSeverity.includes("critical") ||
      cleanSeverity.includes("critical hub") ||
      cleanSeverity === "critical hub (10 ++)"
    )
      return "Critical Hub (10 ++)";
    if (
      cleanSeverity.includes("major") ||
      cleanSeverity.includes("major hub") ||
      cleanSeverity === "major hub (5~10)"
    )
      return "Major Hub (5~10)";
    if (
      cleanSeverity.includes("minor") ||
      cleanSeverity.includes("minor hub") ||
      cleanSeverity === "minor hub (1~4)"
    )
      return "Minor Hub (1~4)";
    if (
      cleanSeverity.includes("single") ||
      cleanSeverity.includes("ftts") ||
      cleanSeverity === "single/ftts"
    )
      return "Single/FTTS";
    return null;
  };

  // Fetch Fuel Summary data from "Fuel Summary" sheet
  const loadFuelSummary = async () => {
    setIsLoadingFuel(true);
    try {
      const rows = await fetchGoogleSheetData("Fuel Summary", "A:D");
      console.log("Fuel Summary rows:", rows);

      if (!rows || rows.length < 2) throw new Error("No fuel summary data");

      const dataRow = rows[1];
      const target = parseFloat(dataRow[0]) || 0;
      const uplift = parseFloat(dataRow[1]) || 0;
      const sitePouring = parseFloat(dataRow[2]) || 0;
      const remaining = parseFloat(dataRow[3]) || 0;

      setFuelSummary({
        fuelTarget: target,
        totalUplift: uplift,
        accessSiteFuelPouring: sitePouring,
        teamInHand: 0,
        availableL: remaining,
        date: new Date().toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      });
      setPercentageAchieved(target > 0 ? (uplift / target) * 100 : 0);
    } catch (error) {
      console.error("Failed to fetch Fuel Summary data:", error);
      setFuelSummary({
        fuelTarget: 0,
        totalUplift: 0,
        accessSiteFuelPouring: 0,
        teamInHand: 0,
        availableL: 0,
        date: new Date().toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      });
      setPercentageAchieved(0);
    } finally {
      setIsLoadingFuel(false);
    }
  };

  // Fetch Master Sheet data and calculate all metrics
  const loadMasterData = async () => {
    setIsLoadingMaster(true);
    try {
      const rows = await fetchGoogleSheetData("Master Sheet", "A:AO");
      if (!rows || rows.length === 0) throw new Error("No data found");

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

      const c1FuelByCategory = {
        "PTN Node": 0,
        "Critical Hub (10 ++)": 0,
        "Major Hub (5~10)": 0,
        "Minor Hub (1~4)": 0,
        "Single/FTTS": 0,
      };
      const c6FuelByCategory = { ...c1FuelByCategory };

      dataRows.forEach((row) => {
        const remainingFuel = parseFloat(row[33]) || 0; // AH
        const region = row[6] ? row[6].toString().trim() : "";
        const rectifierAlarm = row[35] ? row[35].toString() : ""; // AJ
        const severityRaw = row[24] ? row[24].toString() : ""; // Y

        if (region === "C-1") {
          c1TotalFuel += remainingFuel;
          if (row[6]) c1SubregionSet.add(row[6].toString());
        } else if (region === "C-6") {
          c6TotalFuel += remainingFuel;
          if (row[6]) c6SubregionSet.add(row[6].toString());
        }

        const hasAlarm =
          rectifierAlarm &&
          rectifierAlarm.trim() !== "" &&
          !["OK", "NORMAL", "NO ALARM"].includes(
            rectifierAlarm.toUpperCase(),
          ) &&
          !rectifierAlarm.toLowerCase().includes("no alarm");
        if (hasAlarm) {
          if (region === "C-1") c1AlarmCount++;
          else if (region === "C-6") c6AlarmCount++;
        }

        const category = mapSeverityToCategory(severityRaw);
        if (category && categoryCounts[category]) {
          categoryCounts[category].total++;
          if (remainingFuel < 50) categoryCounts[category].less50++;
          else categoryCounts[category].greater50++;

          if (region === "C-1") c1FuelByCategory[category] += remainingFuel;
          else if (region === "C-6")
            c6FuelByCategory[category] += remainingFuel;
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

      const toArray = (obj) =>
        Object.entries(obj)
          .filter(([, fuel]) => fuel > 0)
          .map(([category, fuel]) => ({
            category,
            remainingFuel: Math.round(fuel),
          }))
          .sort((a, b) => b.remainingFuel - a.remainingFuel);

      setC1RemainingFuelByCategory(toArray(c1FuelByCategory));
      setC6RemainingFuelByCategory(toArray(c6FuelByCategory));
      setC1TotalRemainingFuel(Math.round(c1TotalFuel));
      setC6TotalRemainingFuel(Math.round(c6TotalFuel));

      const updatedCategories = dgCategories.map((cat) => ({
        ...cat,
        total: categoryCounts[cat.name]?.total || 0,
        less50: categoryCounts[cat.name]?.less50 || 0,
        greater50: categoryCounts[cat.name]?.greater50 || 0,
      }));
      setDgCategories(updatedCategories);

      const total = updatedCategories.reduce((sum, cat) => sum + cat.total, 0);
      setTotalDGs(total);
      setTotalLess50(
        updatedCategories.reduce((sum, cat) => sum + cat.less50, 0),
      );
      setTotalGreater50(
        updatedCategories.reduce((sum, cat) => sum + cat.greater50, 0),
      );
    } catch (error) {
      console.error("Failed to fetch Master Sheet data:", error);
      setFuelDistribution({
        c1RemainingFuel: 0,
        c6RemainingFuel: 0,
        c1Subregion: "",
        c6Subregion: "",
        c1RectifierAlarmCount: 0,
        c6RectifierAlarmCount: 0,
      });
      setC1RemainingFuelByCategory([]);
      setC6RemainingFuelByCategory([]);
      setC1TotalRemainingFuel(0);
      setC6TotalRemainingFuel(0);
      setDgCategories([
        { name: "PTN Node", total: 0, less50: 0, greater50: 0 },
        { name: "Critical Hub (10 ++)", total: 0, less50: 0, greater50: 0 },
        { name: "Major Hub (5~10)", total: 0, less50: 0, greater50: 0 },
        { name: "Minor Hub (1~4)", total: 0, less50: 0, greater50: 0 },
        { name: "Single/FTTS", total: 0, less50: 0, greater50: 0 },
      ]);
      setTotalDGs(0);
      setTotalLess50(0);
      setTotalGreater50(0);
    } finally {
      setIsLoadingMaster(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      await loadFuelSummary();
      await loadMasterData();
    };
    fetchAll();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const goToWeatherPage = () => setShowWeatherPage(true);
  const goToDashboard = () => setShowWeatherPage(false);
  const goToMap = () => navigate("/map");
  const goToRIFDashboard = () => navigate("/rif-dashboard");
  const goToDGAutoCheck = () => navigate("/dg-auto-check");

  const navItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      active: !showWeatherPage,
      onClick: goToDashboard,
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

  const exportCategoriesToCSV = () => {
    let csv = "Category,Total Sites,Fuel <50L,Fuel >50L,Percentage of Total\n";
    dgCategories.forEach((cat) => {
      const perc = totalDGs > 0 ? ((cat.total / totalDGs) * 100).toFixed(1) : 0;
      csv += `"${cat.name}",${cat.total},${cat.less50},${cat.greater50},${perc}\n`;
    });
    csv += `"TOTAL",${totalDGs},${totalLess50},${totalGreater50},100\n\n`;
    csv += "C-1 REMAINING FUEL BY CATEGORY\nCategory,Remaining Fuel (L)\n";
    c1RemainingFuelByCategory.forEach((item) => {
      csv += `"${item.category}",${item.remainingFuel}\n`;
    });
    csv += `"TOTAL C-1",${c1TotalRemainingFuel}\n\n`;
    csv += "C-6 REMAINING FUEL BY CATEGORY\nCategory,Remaining Fuel (L)\n";
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
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
            <LiveWeatherRadar />
            <div>
              <WeatherSummaryCard />
            </div>
          </div>
          <SitesByCategoryTable
            dgCategories={dgCategories}
            totalDGs={totalDGs}
            totalLess50={totalLess50}
            totalGreater50={totalGreater50}
            isLoadingMaster={isLoadingMaster}
            onExport={exportCategoriesToCSV}
          />
          <FuelSummary
            fuelSummary={fuelSummary}
            percentageAchieved={percentageAchieved}
            isLoading={isLoadingFuel}
          />
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
