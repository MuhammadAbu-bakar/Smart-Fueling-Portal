// src/pages/SitesMap.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchGoogleSheetData } from "/backend/GoogleSheetApi";
import {
  TowerControl,
  AlertTriangle,
  Search,
  LayoutDashboard,
  Menu,
  Map as MapIcon,
  ZapIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import L from "leaflet";

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icons
const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const SitesMap = () => {
  const [masterData, setMasterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [targetSite, setTargetSite] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("All");

  const mapRef = useRef();

  // ================= FETCH DATA =================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const master = await fetchGoogleSheetData("Master Sheet", "A:AO");
        if (master && master.length > 1) {
          setMasterData(master.slice(1));
        }
      } catch (error) {
        console.error("Error fetching master data:", error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // ================= COLUMN INDICES =================
  const COL_SITE_ID = 0; // A
  const COL_REGION = 6; // G
  const COL_STATUS = 34; // AI
  const COL_SEVERITY = 24; // Y
  const COL_REMAINING_FUEL = 33; // AH
  const COL_LAT_LONG = 40; // AO

  // ================= PROCESS SITES =================
  const allSites = useMemo(() => {
    return masterData
      .map((row, index) => {
        const latLongStr = row[COL_LAT_LONG]?.toString().trim();
        if (!latLongStr) return null;

        const coords = latLongStr
          .split(/[, ]+/)
          .map((c) => parseFloat(c.trim()));
        if (coords.length < 2 || isNaN(coords[0]) || isNaN(coords[1]))
          return null;

        const region = (row[COL_REGION] || "").toString().trim().toUpperCase();
        const status = (row[COL_STATUS] || "").toString().trim().toUpperCase();
        const severity = (row[COL_SEVERITY] || "").toString().trim();

        return {
          id: row[COL_SITE_ID]?.toString().trim() || `Site-${index}`,
          region: region || "UNKNOWN",
          status,
          severity,
          remainingFuel: parseFloat(row[COL_REMAINING_FUEL]) || 0,
          position: [coords[0], coords[1]],
        };
      })
      .filter(Boolean);
  }, [masterData]);

  // Filter sites based on selected region
  const sites = useMemo(() => {
    if (selectedRegion === "All") return allSites;
    return allSites.filter((site) => site.region === selectedRegion);
  }, [allSites, selectedRegion]);

  // Search Handler
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    const found = allSites.find(
      (s) => s.id.toLowerCase() === searchTerm.toLowerCase().trim(),
    );
    if (found) {
      setTargetSite(found);
      if (found.region !== selectedRegion && found.region !== "UNKNOWN") {
        setSelectedRegion(found.region);
      }
    } else {
      alert("Site ID not found!");
    }
  };

  const FlyToTarget = () => {
    const map = useMap();
    if (targetSite) {
      // Slower fly‑to animation (2.5 seconds) and slightly lower zoom level (14)
      map.flyTo(targetSite.position, 14, { duration: 2.5 });
      setTimeout(() => setTargetSite(null), 3000);
    }
    return null;
  };

  const center = [31.5, 73.0];

  return (
    <div className="min-h-screen bg-[#0f1325] text-white flex overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:relative z-20 w-72 bg-[#13182b] border-r border-gray-800 p-6 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-500 p-2 rounded-xl">
            <TowerControl size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl">Fuel Dashboard</h1>
            <p className="text-gray-400 text-sm">Network Operations</p>
          </div>
        </div>

        <nav className="space-y-3">
          <Link
            to="/dashboard"
            className="w-full flex items-center gap-3 text-gray-400 hover:bg-[#1a213a] px-4 py-3 rounded-xl transition"
          >
            <LayoutDashboard size={20} /> Dashboard
          </Link>

          <Link
            to="/map"
            className="w-full flex items-center gap-3 bg-blue-600/20 text-blue-400 px-4 py-3 rounded-xl"
          >
            <MapIcon size={20} /> Sites Map
          </Link>

          <Link
            to="/rif-dashboard"
            className="w-full flex items-center gap-3 text-gray-400 hover:bg-[#1a213a] px-4 py-3 rounded-xl transition"
          >
            <ZapIcon size={20} /> RIF Alarms
          </Link>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden bg-[#171c33] p-3 rounded-xl"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Sites Map</h1>
              <p className="text-gray-400">
                Real-time location of all fuel sites
              </p>
            </div>
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Region:</span>
            <div className="flex bg-[#171c33] rounded-xl border border-gray-800 p-1">
              {["All", "C-1", "C-6"].map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-5 py-2 text-sm font-medium rounded-[10px] transition ${
                    selectedRegion === region
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-[#1f253f]"
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#171c33] px-5 py-3 rounded-xl border border-gray-800 text-sm">
            Total Sites:{" "}
            <span className="font-bold text-blue-400">{sites.length}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4 max-w-md flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search Site ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-[#171c33] border border-gray-700 rounded-xl pl-11 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl font-medium transition flex items-center gap-2"
          >
            <Search size={20} /> Search
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center flex-1 bg-[#171c33] rounded-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex-1 bg-[#171c33] rounded-2xl border border-gray-800 overflow-hidden relative">
            <MapContainer
              center={center}
              zoom={8}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />

              <FlyToTarget />

              {/* All Markers */}
              {sites.map((site, index) => (
                <Marker
                  key={index}
                  position={site.position}
                  icon={
                    site.status === "NOK" || site.remainingFuel < 50
                      ? redIcon
                      : greenIcon
                  }
                >
                  <Popup>
                    <div className="min-w-[260px]">
                      <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                        {site.id}
                        {(site.status === "NOK" || site.remainingFuel < 50) && (
                          <AlertTriangle size={22} className="text-red-500" />
                        )}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Region:</strong> {site.region}
                        </p>
                        <p>
                          <strong>Status:</strong>
                          <span
                            className={
                              site.status === "NOK"
                                ? "text-red-500 font-semibold"
                                : "text-green-500 font-semibold"
                            }
                          >
                            {site.status}
                          </span>
                        </p>
                        <p>
                          <strong>Severity:</strong> {site.severity || "N/A"}
                        </p>
                        <p>
                          <strong>Remaining Fuel:</strong>{" "}
                          {site.remainingFuel.toFixed(0)} L
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-6 text-sm justify-center text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500/30 border border-green-500 rounded"></div>
            Normal Fuel (≥ 50L)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/30 border border-red-500 rounded"></div>
            Low Fuel (less than 50L) or NOK Status
          </div>
          <div>Green = Normal &nbsp; | &nbsp; Red = Critical</div>
        </div>
      </main>
    </div>
  );
};

export default SitesMap;
