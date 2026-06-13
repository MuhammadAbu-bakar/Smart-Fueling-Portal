// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Map, Zap, CheckCircle, Fuel } from "lucide-react";

import WeatherSummaryCard from "../components/WeatherSummaryCard";
import LiveWeatherRadar from "../components/LiveWeatherRadar";
import SitesByCategoryTable from "../components/SitesByCategoryTable";
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

  // ================= FUEL DISTRIBUTION DATA =================
  const [fuelDistribution, setFuelDistribution] = useState({
    c1RemainingFuel: 0,
    c6RemainingFuel: 0,
    c1Subregion: "",
    c6Subregion: "",
    c1RectifierAlarmCount: 0,
    c6RectifierAlarmCount: 0,
  });

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

  const [c1RemainingFuelByCategory, setC1RemainingFuelByCategory] = useState(
    [],
  );
  const [c6RemainingFuelByCategory, setC6RemainingFuelByCategory] = useState(
    [],
  );
  const [c1TotalRemainingFuel, setC1TotalRemainingFuel] = useState(0);
  const [c6TotalRemainingFuel, setC6TotalRemainingFuel] = useState(0);

  // NEW: store sites with fuel < 50 litres for export
  const [sitesWithFuelLess50, setSitesWithFuelLess50] = useState([]);

  // Helper: map Severity to standard categories
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

  // Load Master Sheet data and calculate all metrics
  const loadMasterData = async () => {
    setIsLoadingMaster(true);
    try {
      const rows = await fetchGoogleSheetData("Master Sheet", "A:AO");
      if (!rows || rows.length === 0) throw new Error("No data found");

      const dataRows = rows.slice(1);
      setMasterData(dataRows);

      // For site‑wise export (fuel < 50)
      const lowFuelSites = [];

      let c1TotalFuel = 0,
        c6TotalFuel = 0,
        c1AlarmCount = 0,
        c6AlarmCount = 0;
      let c1SubregionSet = new Set(),
        c6SubregionSet = new Set();

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

        // Site details for export (fuel < 50)
        if (remainingFuel < 50 && remainingFuel > 0) {
          lowFuelSites.push({
            siteId: row[0] || "", // Column A
            siteName: row[1] || "", // Column B
            subRegion: row[6] || "", // Column G
            remainingFuel: remainingFuel,
            severity: mapSeverityToCategory(severityRaw) || severityRaw,
            rectifierAlarm: rectifierAlarm,
          });
        }

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

      setSitesWithFuelLess50(lowFuelSites);

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
      // set defaults
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
      setSitesWithFuelLess50([]);
    } finally {
      setIsLoadingMaster(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // NEW: Export site‑wise details of sites with fuel < 50 litres
  const exportLowFuelSites = () => {
    if (sitesWithFuelLess50.length === 0) {
      alert("No sites with remaining fuel < 50 litres found.");
      return;
    }

    const headers = [
      "Site ID",
      "Site Name",
      "Sub Region",
      "Remaining Fuel (L)",
      "Severity Category",
      "Rectifier Alarm",
    ];

    const csvRows = [
      headers.join(","),
      ...sitesWithFuelLess50.map((site) =>
        [
          `"${(site.siteId || "").replace(/"/g, '""')}"`,
          `"${(site.siteName || "").replace(/"/g, '""')}"`,
          `"${(site.subRegion || "").replace(/"/g, '""')}"`,
          site.remainingFuel,
          `"${(site.severity || "").replace(/"/g, '""')}"`,
          `"${(site.rectifierAlarm || "").replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `sites_fuel_less50_${new Date().toISOString().slice(0, 19)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const goToWeatherPage = () => setShowWeatherPage(true);
  const goToDashboard = () => setShowWeatherPage(false);
  const goToMap = () => navigate("/map");
  const goToRIFDashboard = () => navigate("/rif-dashboard");
  const goToDGAutoCheck = () => navigate("/dg-auto-check");
  const goToFuelManagement = () => navigate("/fuel-summary");

  const navItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      active: !showWeatherPage,
      onClick: goToDashboard,
    },
    {
      name: "Fuel Performance",
      icon: Fuel,
      active: false,
      onClick: goToFuelManagement,
    },
    {
      name: "DG Auto Check",
      icon: CheckCircle,
      active: false,
      onClick: goToDGAutoCheck,
    },
    { name: "Sites Map", icon: Map, active: false, onClick: goToMap },
    {
      name: "RIF Alarms",
      icon: Zap,
      active: false,
      onClick: goToRIFDashboard,
    },
  ];

  // Weather page view
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

  // Main Dashboard view
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

          {/* Sites by Category Table – export now triggers site‑wise CSV */}
          <SitesByCategoryTable
            dgCategories={dgCategories}
            totalDGs={totalDGs}
            totalLess50={totalLess50}
            totalGreater50={totalGreater50}
            isLoadingMaster={isLoadingMaster}
            onExport={exportLowFuelSites}
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
