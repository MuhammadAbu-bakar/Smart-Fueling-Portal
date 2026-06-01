// src/pages/WeatherVulnerableSites.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  CloudRain, 
  Clock, 
  Download, 
  RefreshCw, 
  MapPin,
  AlertCircle,
  LayoutDashboard,
  Menu,
  TowerControl,
  Map,
  Loader
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchGoogleSheetData } from '/backend/GoogleSheetApi';

const WeatherVulnerableSites = () => {
  const [masterData, setMasterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sitesWithWeather, setSitesWithWeather] = useState([]);

  // Column Indices
  const COLUMNS = {
    SITE_ID: 0,
    SITE_NAME: 1,
    SUBREGION: 6,
    REMAINING_FUEL: 8,
    CATEGORY: 18,
    LAT_LONG: 17,      // R Column (lat,long)
  };

  // Fetch Master Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const master = await fetchGoogleSheetData("Master Sheet", "A:U");
        if (master && master.length > 1) {
          setMasterData(master.slice(1));
        }
        setLastUpdated(new Date().toLocaleString());
      } catch (err) {
        setError("Failed to load data from Google Sheets.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Fetch Real Weather from Open-Meteo
  const fetchWeatherForSites = async () => {
    setWeatherLoading(true);
    const results = [];

    for (const row of masterData) {
      const fuel = parseFloat(row[COLUMNS.REMAINING_FUEL]) || 0;
      if (fuel >= 50) continue;

      const latLongStr = (row[COLUMNS.LAT_LONG] || "").toString().trim();
      if (!latLongStr.includes(',')) continue;

      const [latStr, lngStr] = latLongStr.split(',').map(s => s.trim());
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lngStr);

      if (isNaN(latitude) || isNaN(longitude)) continue;

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`
        );
        const data = await response.json();

        const daily = data.daily;
        const hasRainNextDays = daily.precipitation_probability_max.slice(0, 5).some(p => p > 40);
        const maxRainProb = Math.max(...daily.precipitation_probability_max.slice(0, 5));

        const riskLevel = maxRainProb > 70 ? "High" : maxRainProb > 40 ? "Medium" : "Low";

        results.push({
          id: row[COLUMNS.SITE_ID] || "N/A",
          name: row[COLUMNS.SITE_NAME] || "Unknown",
          subregion: row[COLUMNS.SUBREGION] || "N/A",
          remainingFuel: fuel,
          category: row[COLUMNS.CATEGORY] || "N/A",
          latitude,
          longitude,
          weatherRisk: riskLevel,
          maxRainProb: maxRainProb,
          affectedLast: "N/A",           // Real history needs more data
          historyLast3: ["N/A", "N/A", "N/A"],
          willBeAffected: hasRainNextDays ? "Yes" : "No",
        });
      } catch (err) {
        console.error(`Weather fetch failed for ${row[COLUMNS.SITE_ID]}`, err);
      }
    }

    setSitesWithWeather(results);
    setWeatherLoading(false);
    setLastUpdated(new Date().toLocaleString());
  };

  // Auto fetch weather when master data is loaded
  useEffect(() => {
    if (masterData.length > 0) {
      fetchWeatherForSites();
    }
  }, [masterData]);

  const filteredSites = useMemo(() => {
    if (!searchTerm) return sitesWithWeather;
    const term = searchTerm.toLowerCase();
    return sitesWithWeather.filter(site =>
      site.name.toLowerCase().includes(term) ||
      site.id.toLowerCase().includes(term) ||
      site.subregion.toLowerCase().includes(term)
    );
  }, [sitesWithWeather, searchTerm]);

  const exportToCSV = () => {
    const headers = ['Site ID','Site Name','Subregion','Remaining Fuel (L)','Category','Latitude','Longitude','Weather Risk','Will Be Affected','Max Rain Prob'];
    const rows = filteredSites.map(site => [
      site.id, site.name, site.subregion, site.remainingFuel.toFixed(1),
      site.category, site.latitude, site.longitude, site.weatherRisk, site.willBeAffected, site.maxRainProb + '%'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-vulnerable-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRiskColor = (risk) => {
    if (risk === "High") return "text-red-400 bg-red-500/20";
    if (risk === "Medium") return "text-orange-400 bg-orange-500/20";
    return "text-yellow-400 bg-yellow-500/20";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1325] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1325] text-white flex">
      {/* Sidebar */}
      <aside className={`fixed md:relative z-20 w-72 bg-[#13182b] border-r border-gray-800 p-6 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
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
          <Link to="/" className="w-full flex items-center gap-3 text-gray-400 hover:bg-[#1a213a] px-4 py-3 rounded-xl transition">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/map" className="w-full flex items-center gap-3 text-gray-400 hover:bg-[#1a213a] px-4 py-3 rounded-xl transition">
            <Map size={20} /> Sites Map
          </Link>
          <Link to="/alarm-sites" className="w-full flex items-center gap-3 text-gray-400 hover:bg-[#1a213a] px-4 py-3 rounded-xl transition">
            <AlertTriangle size={20} /> Alarm Sites
          </Link>
          <Link to="/weather-vulnerable" className="w-full flex items-center gap-3 bg-amber-600/20 text-amber-400 px-4 py-3 rounded-xl">
            <CloudRain size={20} /> Weather Risk Sites
          </Link>
        </nav>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 overflow-auto">
        <div className="bg-[#13182b] border-b border-gray-800 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden bg-[#0f1325] p-2 rounded-lg">
                  <Menu size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/20 p-2 rounded-lg">
                    <CloudRain className="text-amber-400" size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Weather Vulnerable Sites</h1>
                    <p className="text-gray-400 text-sm">Low Fuel Sites (&lt;50L) - Real Weather Forecast</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={fetchWeatherForSites} 
                  disabled={weatherLoading}
                  className="bg-[#0f1325] hover:bg-[#1a213a] px-3 py-2 rounded-lg flex items-center gap-2 text-sm disabled:opacity-70"
                >
                  {weatherLoading ? <Loader size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Refresh Weather
                </button>
                <button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 flex items-center gap-2"><AlertCircle size={16} /> {error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-900/20 rounded-2xl p-5 border border-amber-500/30">
              <p className="text-gray-300 text-sm">Total Low Fuel Sites</p>
              <p className="text-4xl font-bold text-white mt-2">{sitesWithWeather.length}</p>
            </div>
            <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 rounded-2xl p-5 border border-red-500/30">
              <p className="text-gray-300 text-sm">High Risk (Rain Expected)</p>
              <p className="text-4xl font-bold text-red-400 mt-2">
                {sitesWithWeather.filter(s => s.weatherRisk === "High").length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-900/20 rounded-2xl p-5 border border-orange-500/30">
              <p className="text-gray-300 text-sm">Likely Affected</p>
              <p className="text-4xl font-bold text-orange-400 mt-2">
                {sitesWithWeather.filter(s => s.willBeAffected === "Yes").length}
              </p>
            </div>
          </div>

          <div className="bg-[#171c33] rounded-2xl p-5 border border-gray-800 mb-8">
            <input
              type="text"
              placeholder="Search by Site ID, Name or Subregion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0f1325] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="bg-[#171c33] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0f1325] border-b border-gray-800">
                  <tr>
                    <th className="text-left p-4 text-gray-400">Site ID</th>
                    <th className="text-left p-4 text-gray-400">Site Name</th>
                    <th className="text-left p-4 text-gray-400">Subregion</th>
                    <th className="text-left p-4 text-gray-400">Remaining Fuel</th>
                    <th className="text-left p-4 text-gray-400">Category</th>
                    <th className="text-left p-4 text-gray-400">Lat, Long</th>
                    <th className="text-left p-4 text-gray-400">Weather Risk</th>
                    <th className="text-left p-4 text-gray-400">Will Be Affected?</th>
                    <th className="text-left p-4 text-gray-400">Max Rain Prob</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSites.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center p-12 text-gray-400">
                        No low fuel sites found or weather data loading...
                      </td>
                    </tr>
                  ) : (
                    filteredSites.map((site, index) => (
                      <tr key={index} className="border-b border-gray-800 hover:bg-[#1a213a] transition-colors">
                        <td className="p-4 font-mono">{site.id}</td>
                        <td className="p-4 font-medium">{site.name}</td>
                        <td className="p-4">{site.subregion}</td>
                        <td className="p-4">
                          <span className={`font-bold ${site.remainingFuel < 20 ? 'text-red-400' : 'text-orange-400'}`}>
                            {site.remainingFuel.toFixed(1)} L
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-gray-700 rounded-full text-xs">{site.category}</span>
                        </td>
                        <td className="p-4 text-sm text-gray-400">
                          {site.latitude?.toFixed(4)}, {site.longitude?.toFixed(4)}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(site.weatherRisk)}`}>
                            {site.weatherRisk} Risk
                          </span>
                        </td>
                        <td className="p-4 font-medium">
                          <span className={site.willBeAffected === "Yes" ? "text-red-400" : "text-green-400"}>
                            {site.willBeAffected}
                          </span>
                        </td>
                        <td className="p-4 text-sm">{site.maxRainProb}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {lastUpdated && (
            <div className="mt-6 text-xs text-gray-500 flex justify-between">
              <div>Last updated: {lastUpdated}</div>
              <div>Data from Open-Meteo (Free Weather API)</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WeatherVulnerableSites;