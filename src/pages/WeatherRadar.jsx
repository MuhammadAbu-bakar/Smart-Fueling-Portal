// src/pages/WeatherRadar.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  CloudRain, 
  Menu, 
  TowerControl, 
  LayoutDashboard, 
  Map, 
  AlertTriangle,
  Fuel,
  MapPin,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchGoogleSheetData } from '/backend/GoogleSheetApi';

const WeatherRadar = () => {
  const [masterData, setMasterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const master = await fetchGoogleSheetData("Master Sheet", "A:U");
        if (master && master.length > 1) {
          setMasterData(master.slice(1));
        }
      } catch (error) {
        console.error("Error loading sites:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Process sites
  const allSites = useMemo(() => {
    return masterData
      .map((row) => {
        const siteId = row[0]?.toString().trim();
        const latLongStr = row[17]?.toString().trim();

        if (!siteId || !latLongStr) return null;

        const coords = latLongStr.split(/[, ]+/).map(c => parseFloat(c.trim()));
        if (coords.length < 2 || isNaN(coords[0]) || isNaN(coords[1])) return null;

        return {
          id: siteId,
          position: [coords[0], coords[1]],
        };
      })
      .filter(Boolean);
  }, [masterData]);

  // Filter sites based on search
  const filteredSites = useMemo(() => {
    if (!searchTerm.trim()) return allSites;
    const term = searchTerm.toLowerCase().trim();
    return allSites.filter(site => 
      site.id.toLowerCase().includes(term)
    );
  }, [allSites, searchTerm]);

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
          <Link to="/weather-radar" className="w-full flex items-center gap-3 bg-sky-600/20 text-sky-400 px-4 py-3 rounded-xl">
            <CloudRain size={20} /> Weather Radar
          </Link>
          <Link to="/nearby-fuel" className="w-full flex items-center gap-3 text-gray-400 hover:bg-[#1a213a] px-4 py-3 rounded-xl transition">
            <Fuel size={20} /> Nearby Fuel Stations
          </Link>
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-[#13182b] border-b border-gray-800 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden bg-[#0f1325] p-3 rounded-xl">
                <Menu size={22} />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-sky-500/20 p-2 rounded-xl">
                  <CloudRain className="text-sky-400" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Live Weather Radar</h1>
                  <p className="text-gray-400 text-sm">Rain + Wind Direction • Telecom Sites</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Windy Radar */}
        <div className="flex-1 relative bg-black">
          <iframe
            src="https://embed.windy.com/embed2.html?lat=30.432&lon=74.574&zoom=7&level=surface&overlay=radar&product=ecmwf&menu=true&message=true&marker=true&calendar=true&pressure=true&type=map&location=coordinates&detail=true&metricWind=km%2Fh&metricTemp=%C2%B0C&radarColors=1&radarRange=250&showStorm=1"
            frameBorder="0"
            style={{ width: "100%", height: "100%" }}
            title="Windy Live Radar"
            allowFullScreen
          ></iframe>

          {/* Searchable Sites Panel */}
          <div className="absolute top-4 right-4 bg-[#0f1325]/95 backdrop-blur-md border border-gray-700 rounded-2xl p-4 w-80 max-h-[75vh] overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} className="text-sky-400" />
              <h3 className="font-semibold text-white">Telecom Sites ({allSites.length})</h3>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search Site ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1a213a] border border-gray-600 rounded-lg pl-9 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="max-h-[calc(75vh-140px)] overflow-auto text-sm text-gray-300 space-y-1 pr-2">
              {filteredSites.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No matching sites found</p>
              ) : (
                filteredSites.map((site, i) => (
                  <div 
                    key={i} 
                    className="flex justify-between items-center py-2 px-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                    onClick={() => {
                      const url = `https://www.windy.com/${site.position[0]}/${site.position[1]}?${site.position[0]},${site.position[1]},10`;
                      window.open(url, '_blank');
                    }}
                  >
                    <div className="font-mono text-sky-300">{site.id}</div>
                    <div className="text-xs text-gray-400 text-right">
                      {site.position[0].toFixed(3)}<br/>
                      {site.position[1].toFixed(3)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WeatherRadar;