import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import SitesMap from "./pages/SitesMap";

import WeatherVulnerableSites from "./pages/WeatherVulnerableSites";

import WeatherRadar from "./pages/WeatherRadar";
import RIFDashboard from "./pages/RIFDashboard";
import WeatherAlertDashboard from "./components/WeatherAlertDashboard";
import DGAutoCheck from "./pages/DGAutoCheck";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard Route */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/map" element={<SitesMap />} />
        <Route path="/rif-dashboard" element={<RIFDashboard />} />
        <Route path="/weather-impact" element={<WeatherAlertDashboard />} />
        <Route path="/dg-auto-check" element={<DGAutoCheck />} />

        {/* Default Route */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
