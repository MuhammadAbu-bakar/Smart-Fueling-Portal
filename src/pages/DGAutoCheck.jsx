// src/pages/DGAutoCheck.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Zap,
  CheckCircle,
  Database,
  BatteryCharging,
  AlertTriangle,
  RefreshCw,
  MinusCircle,
  Filter,
  Download,
} from "lucide-react";
import { fetchGoogleSheetData } from "/backend/GoogleSheetApi";
import SideBar from "../components/SideBar";
import TopBar from "../components/TopBar";

// Column indexes (0‑based, A=0, AD=29, BA=52)
const COL = {
  SITE_ID: 0,
  SUB_REGION: 6,
  SAVING_MODE: 29,
  PENALTY: 52,
  LAST_CP_FAILURE: 40,
  LAST_DG_RUNNING: 41,
  LAST_STATUS: 43,
  SECOND_LAST_CP_FAILURE: 44,
  SECOND_LAST_DG_RUNNING: 45,
  SECOND_LAST_STATUS: 47,
  THIRD_LAST_CP_FAILURE: 48,
  THIRD_LAST_DG_RUNNING: 49,
  THIRD_LAST_STATUS: 51,
};

const DGAutoCheck = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subRegionFilter, setSubRegionFilter] = useState("All");
  const [kpis, setKpis] = useState({
    total: 0,
    savingYes: 0,
    penaltyDashCount: 0,
    dgAutoNeedsCheck: 0,
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      active: false,
      onClick: () => navigate("/"),
    },
    {
      name: "DG Auto Check",
      icon: CheckCircle,
      active: true,
      onClick: () => {},
    },
    {
      name: "Sites Map",
      icon: Map,
      active: false,
      onClick: () => navigate("/map"),
    },
    {
      name: "RIF Alarms",
      icon: Zap,
      active: false,
      onClick: () => navigate("/rif-dashboard"),
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchGoogleSheetData("DG Auto Check", "A:BA");
      if (!rows || rows.length < 2) throw new Error("No data found");
      setAllData(rows.slice(1));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allData.length) return;

    let filtered = [...allData];
    if (subRegionFilter !== "All") {
      filtered = filtered.filter(
        (row) =>
          (row[COL.SUB_REGION] || "").toString().trim() === subRegionFilter,
      );
    }
    setFilteredData(filtered);

    let savingYes = 0;
    let penaltyDashCount = 0;
    let dgAutoNeedsCheck = 0;

    filtered.forEach((row) => {
      const saving = row[COL.SAVING_MODE]?.toString().trim();
      const penalty = row[COL.PENALTY]?.toString().trim() || "";

      if (saving === "Yes") {
        savingYes++;
        if (penalty === "-") penaltyDashCount++;
        if (penalty.toLowerCase() === "needs to check why on auto") {
          dgAutoNeedsCheck++;
        }
      }
    });

    setKpis({
      total: filtered.length,
      savingYes,
      penaltyDashCount,
      dgAutoNeedsCheck,
    });
  }, [allData, subRegionFilter]);

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (val) => {
    const v = val?.toString().trim() || "-";
    const lower = v.toLowerCase();
    if (lower.includes("fail"))
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
          {v}
        </span>
      );
    if (lower.includes("ok") || lower.includes("success"))
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
          {v}
        </span>
      );
    if (lower.includes("warn"))
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
          {v}
        </span>
      );
    return (
      <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
        {v}
      </span>
    );
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = [
      "Site ID",
      "Sub-Region",
      "Last CP Failure",
      "Last DG Running",
      "Last Status",
      "2nd Last CP Failure",
      "2nd Last DG Running",
      "2nd Last Status",
      "3rd Last CP Failure",
      "3rd Last DG Running",
      "3rd Last Status",
    ];

    const rows = filteredData.map((row) => [
      row[COL.SITE_ID] || "",
      row[COL.SUB_REGION] || "",
      row[COL.LAST_CP_FAILURE] || "",
      row[COL.LAST_DG_RUNNING] || "",
      row[COL.LAST_STATUS] || "",
      row[COL.SECOND_LAST_CP_FAILURE] || "",
      row[COL.SECOND_LAST_DG_RUNNING] || "",
      row[COL.SECOND_LAST_STATUS] || "",
      row[COL.THIRD_LAST_CP_FAILURE] || "",
      row[COL.THIRD_LAST_DG_RUNNING] || "",
      row[COL.THIRD_LAST_STATUS] || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute(
      "download",
      `dg_auto_check_${new Date().toISOString().slice(0, 19)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="h-screen bg-[#0f1325] text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg"
          >
            Retry
          </button>
        </div>
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Header with Filter */}
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">DG Auto Check Dashboard</h1>
              <p className="text-gray-400 text-sm">
                Monitoring DG Auto Mode and Saving Status
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                <Filter size={16} className="text-gray-600" />
                <select
                  value={subRegionFilter}
                  onChange={(e) => setSubRegionFilter(e.target.value)}
                  className="bg-transparent text-black text-sm focus:outline-none"
                >
                  <option value="All">All Sub‑Regions</option>
                  <option value="C-1">C‑1</option>
                  <option value="C-6">C‑6</option>
                </select>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a213a] rounded-lg"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#13182b] rounded-xl p-5 border border-gray-800">
              <div className="flex justify-between">
                <p className="text-gray-400">Total Sites</p>
                <Database className="text-blue-400" />
              </div>
              <p className="text-3xl font-bold mt-2">
                {loading ? "..." : kpis.total}
              </p>
            </div>
            <div className="bg-[#13182b] rounded-xl p-5 border border-gray-800">
              <div className="flex justify-between">
                <p className="text-gray-400">Saving Mode (Yes)</p>
                <BatteryCharging className="text-green-400" />
              </div>
              <p className="text-3xl font-bold mt-2">
                {loading ? "..." : kpis.savingYes}
              </p>
            </div>
            <div className="bg-[#13182b] rounded-xl p-5 border border-gray-800">
              <div className="flex justify-between">
                <p className="text-gray-400">Penalty (-)</p>
                <MinusCircle className="text-yellow-400" />
              </div>
              <p className="text-3xl font-bold mt-2">
                {loading ? "..." : kpis.penaltyDashCount}
              </p>
            </div>
            <div className="bg-[#13182b] rounded-xl p-5 border border-gray-800">
              <div className="flex justify-between">
                <p className="text-gray-400">DG Auto (Needs Check)</p>
                <AlertTriangle className="text-red-400" />
              </div>
              <p className="text-3xl font-bold mt-2">
                {loading ? "..." : kpis.dgAutoNeedsCheck}
              </p>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-[#13182b] rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="font-semibold">DG Auto Check Details</h2>
                {subRegionFilter !== "All" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Showing sites in{" "}
                    <span className="text-blue-400">{subRegionFilter}</span>
                  </p>
                )}
              </div>
              <button
                onClick={exportToCSV}
                disabled={filteredData.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm transition-colors"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0f1325]">
                  <tr className="border-b border-gray-800">
                    <th className="p-3 text-left">Site ID</th>
                    <th>Sub-Region</th>
                    <th>Last CP Failure</th>
                    <th>Last DG Running</th>
                    <th>Last Status</th>
                    <th>2nd Last CP Failure</th>
                    <th>2nd Last DG Running</th>
                    <th>2nd Last Status</th>
                    <th>3rd Last CP Failure</th>
                    <th>3rd Last DG Running</th>
                    <th>3rd Last Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="text-center p-8">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="text-center p-8 text-gray-400"
                      >
                        No data for the selected filter
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-800/50 hover:bg-[#1a213a]"
                      >
                        <td className="p-3 font-mono">
                          {row[COL.SITE_ID] || "-"}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              row[COL.SUB_REGION] === "C-1"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-cyan-500/20 text-cyan-400"
                            }`}
                          >
                            {row[COL.SUB_REGION] || "-"}
                          </span>
                        </td>
                        <td className="p-3">
                          {row[COL.LAST_CP_FAILURE] || "-"}
                        </td>
                        <td className="p-3">
                          {row[COL.LAST_DG_RUNNING] || "-"}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(row[COL.LAST_STATUS])}
                        </td>
                        <td className="p-3">
                          {row[COL.SECOND_LAST_CP_FAILURE] || "-"}
                        </td>
                        <td className="p-3">
                          {row[COL.SECOND_LAST_DG_RUNNING] || "-"}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(row[COL.SECOND_LAST_STATUS])}
                        </td>
                        <td className="p-3">
                          {row[COL.THIRD_LAST_CP_FAILURE] || "-"}
                        </td>
                        <td className="p-3">
                          {row[COL.THIRD_LAST_DG_RUNNING] || "-"}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(row[COL.THIRD_LAST_STATUS])}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DGAutoCheck;
