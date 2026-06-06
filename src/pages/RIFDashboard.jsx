// src/pages/RIFDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Fuel,
  AlertTriangle,
  TowerControl,
  Menu,
  Map,
  TrendingUp,
  Truck,
  Package,
  CloudRain,
  Bell,
  FileText,
  Clock,
  BarChart3,
  Users,
  Circle,
  Droplets,
  Wind,
  Thermometer,
  Zap,
  AlertCircle,
  Calendar,
  RefreshCw,
  ZapOff,
  Battery,
  Power,
  Shield,
  Activity,
  ChevronRight,
  XCircle,
  CheckCircle,
  Info,
  Maximize2,
  Minimize2,
  Navigation,
  ExternalLink,
  Filter,
  CloudRain as WeatherIcon,
  Droplet,
  Wind as WindIcon,
  Hourglass,
  Download,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom RED marker icon for RIF alarms
const redMarkerIcon = L.divIcon({
  html: `<div style="
    background-color: #ef4444; 
    width: 16px; 
    height: 16px; 
    border-radius: 50%; 
    border: 2px solid white; 
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
    animation: pulse-red 1.5s infinite;
  "></div>
  <style>
    @keyframes pulse-red {
      0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
      }
    }
  </style>`,
  className: "custom-marker-icon",
  iconSize: [16, 16],
  popupAnchor: [0, -8],
});

// Custom BLUE marker icon for bad weather affected sites
const weatherMarkerIcon = L.divIcon({
  html: `<div style="
    background-color: #3b82f6; 
    width: 18px; 
    height: 18px; 
    border-radius: 50%; 
    border: 2px solid white; 
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
    animation: pulse-blue 1.5s infinite;
  "></div>
  <style>
    @keyframes pulse-blue {
      0% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      }
    }
  </style>`,
  className: "custom-marker-icon",
  iconSize: [18, 18],
  popupAnchor: [0, -9],
});

// Component to add zoom controls to map
const MapZoomControls = () => {
  const map = useMap();

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleFitBounds = () => {
    if (map.getBounds().isValid()) {
      map.fitBounds(map.getBounds());
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={handleZoomIn}
        className="bg-[#1a2142] hover:bg-[#25306b] text-white p-2 rounded-lg shadow-lg transition-all"
      >
        <Maximize2 size={18} />
      </button>
      <button
        onClick={handleZoomOut}
        className="bg-[#1a2142] hover:bg-[#25306b] text-white p-2 rounded-lg shadow-lg transition-all"
      >
        <Minimize2 size={18} />
      </button>
      <button
        onClick={handleFitBounds}
        className="bg-[#1a2142] hover:bg-[#25306b] text-white p-2 rounded-lg shadow-lg transition-all"
      >
        <Navigation size={18} />
      </button>
    </div>
  );
};

// Main RIF Dashboard Component
const RIFDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rifAlarms, setRifAlarms] = useState([]);
  const [alarmStats, setAlarmStats] = useState({
    totalAlarms: 0,
    badWeatherAffected: 0,
    lowFuelSites: 0,
    moderateRiskSites: 0,
    affectedRegions: [],
    siteCategoryStats: {},
  });
  const [mapCenter, setMapCenter] = useState([30.3753, 69.3451]);
  const [mapZoom, setMapZoom] = useState(5.5);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [weatherData, setWeatherData] = useState({});

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ================= CATEGORY MAPPING (same as Dashboard) =================
  const mapSeverityToCategory = (severity) => {
    if (!severity) return "Unknown";

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

    return "Other";
  };

  // Parse coordinates from Google Sheets format (Column AO)
  const parseCoordinates = (coordinateString) => {
    if (!coordinateString || typeof coordinateString !== "string") return null;

    const cleanStr = coordinateString.trim().replace(/\s+/g, " ");
    const parts = cleanStr.split(",");

    if (parts.length !== 2) return null;

    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());

    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90) return null;
    if (lng < -180 || lng > 180) return null;

    return { lat, lng };
  };

  // Format duration from Column AM (index 38)
  const formatDuration = (duration) => {
    if (!duration) return "N/A";
    const durationStr = duration.toString().trim();
    if (!isNaN(durationStr) && durationStr !== "") {
      const hours = parseFloat(durationStr);
      if (hours < 1) {
        return `${Math.round(hours * 60)} mins`;
      } else if (hours < 24) {
        return `${hours.toFixed(1)} hours`;
      } else {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        if (remainingHours > 0) {
          return `${days}d ${remainingHours.toFixed(0)}h`;
        }
        return `${days} days`;
      }
    }
    return durationStr;
  };

  // Get duration color based on length
  const getDurationColor = (duration) => {
    if (!duration) return "text-gray-400";
    const durationStr = duration.toString().trim();
    const hours = parseFloat(durationStr);
    if (isNaN(hours)) return "text-gray-400";
    if (hours > 48) return "text-red-500 font-bold";
    if (hours > 24) return "text-orange-400";
    if (hours > 12) return "text-yellow-400";
    return "text-green-400";
  };

  // Get site condition based on weather risk and fuel level
  const getSiteCondition = (weatherRisk, remainingFuel) => {
    if (weatherRisk === "Critical" || weatherRisk === "High") {
      return "Bad Weather Affected";
    }
    if (remainingFuel < 50) {
      return "Low Fuel (<50L)";
    }
    return "Moderate Risk";
  };

  // Get condition color for UI
  const getConditionColor = (condition) => {
    switch (condition) {
      case "Bad Weather Affected":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      case "Low Fuel (<50L)":
        return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "Moderate Risk":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    }
  };

  // Get condition icon
  const getConditionIcon = (condition) => {
    switch (condition) {
      case "Bad Weather Affected":
        return <CloudRain size={14} className="text-red-400" />;
      case "Low Fuel (<50L)":
        return <Fuel size={14} className="text-orange-400" />;
      case "Moderate Risk":
        return <AlertTriangle size={14} className="text-yellow-400" />;
      default:
        return <Info size={14} className="text-gray-400" />;
    }
  };

  // Get weather risk from Open-Meteo API (unchanged)
  const getWeatherRiskFromAPI = async (latitude, longitude) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,precipitation_probability_max,windspeed_10m_max&timezone=auto`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      let weatherCode = data.current_weather?.weathercode;
      if (!weatherCode && data.daily?.weathercode) {
        weatherCode = data.daily.weathercode[0];
      }

      const precipProbability =
        data.daily?.precipitation_probability_max?.[0] || 0;
      const windSpeed =
        data.current_weather?.windspeed ||
        data.daily?.windspeed_10m_max?.[0] ||
        0;

      let risk = "Low";
      let weatherDesc = "";

      if (weatherCode) {
        if ([95, 96, 99].includes(weatherCode)) {
          risk = "Critical";
          weatherDesc = "Thunderstorm";
        } else if ([65, 66, 67, 71, 72, 73, 74, 75, 82].includes(weatherCode)) {
          risk = "Critical";
          weatherDesc = "Heavy Rain/Snow";
        } else if ([61, 63, 64, 80, 81, 85, 86].includes(weatherCode)) {
          risk = "High";
          weatherDesc = "Moderate Rain/Snow";
        } else if ([51, 53, 55, 56, 57].includes(weatherCode)) {
          risk = "Moderate";
          weatherDesc = "Drizzle";
        } else if ([45, 48].includes(weatherCode)) {
          risk = "Moderate";
          weatherDesc = "Fog";
        } else {
          risk = "Low";
          weatherDesc = "Clear/Cloudy";
        }
      }

      if (precipProbability > 80) risk = "Critical";
      else if (precipProbability > 60) risk = "High";
      else if (precipProbability > 40) risk = "Moderate";

      if (windSpeed > 60) risk = "Critical";
      else if (windSpeed > 40) risk = "High";
      else if (windSpeed > 25) risk = "Moderate";

      return {
        risk,
        weatherDesc,
        precipProbability,
        windSpeed,
        temperature: data.current_weather?.temperature,
      };
    } catch (error) {
      console.error("Weather API error:", error);
      return {
        risk: "Low",
        weatherDesc: "Unknown",
        precipProbability: 0,
        windSpeed: 0,
        temperature: null,
      };
    }
  };

  // Fetch weather for all sites with rate limiting (unchanged)
  const fetchWeatherForSites = async (sites) => {
    const weatherResults = {};
    const concurrencyLimit = 3;

    for (let i = 0; i < sites.length; i += concurrencyLimit) {
      const batch = sites.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(async (site) => {
        if (site.coordinates) {
          const weather = await getWeatherRiskFromAPI(
            site.coordinates.lat,
            site.coordinates.lng,
          );
          weatherResults[site.id] = weather;
        }
      });
      await Promise.all(batchPromises);

      if (i + concurrencyLimit < sites.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return weatherResults;
  };

  // Export to Excel (CSV) – uses normalized category
  const exportToExcel = () => {
    const currentFilteredAlarms = rifAlarms.filter((alarm) => {
      const regionMatch =
        selectedRegion === "All" || alarm.region === selectedRegion;
      return regionMatch;
    });

    if (currentFilteredAlarms.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = [
      "Site Name",
      "Site ID",
      "Region",
      "Duration",
      "Occur Time",
      "Alarm Message",
      "Remaining Fuel (L)",
      "Weather Risk",
      "Weather Description",
      "Precipitation (%)",
      "Wind Speed (km/h)",
      "Temperature (°C)",
      "Category",
    ];

    const rows = currentFilteredAlarms.map((alarm) => [
      alarm.name,
      alarm.siteId,
      alarm.region,
      formatDuration(alarm.duration),
      alarm.occurTime || "N/A",
      alarm.alarmMessage,
      alarm.remainingFuel,
      alarm.weatherRisk,
      alarm.weatherDesc || "N/A",
      alarm.precipProbability || "N/A",
      alarm.windSpeed || "N/A",
      alarm.temperature || "N/A",
      alarm.siteCategory,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `RIF_Alarms_${selectedRegion}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fetch data from Google Sheets – with category mapping
  const fetchRIFData = async () => {
    setIsLoading(true);
    try {
      const { fetchGoogleSheetData } = await import("/backend/GoogleSheetApi");

      // UPDATED: range to A:AO
      const rows = await fetchGoogleSheetData("Master Sheet", "A:AO");

      if (!rows || rows.length === 0) {
        throw new Error("No data found");
      }

      const dataRows = rows.slice(1);

      const alarmSites = [];
      const regionCount = {};
      const siteCategoryCount = {};

      // Column indices (0-based)
      const COL_RECTIFIER_ALARM = 35; // AJ
      const COL_LAT_LONG = 40; // AO
      const COL_REGION = 6; // G
      const COL_DURATION = 38; // AM
      const COL_REMAINING_FUEL = 33; // AH
      const COL_SEVERITY = 24; // Y (raw severity)
      const COL_SITE_NAME = 0; // A
      const COL_SITE_ID = 1; // B
      const COL_OCCUR_TIME = 36; // AK

      for (const row of dataRows) {
        const rectifierAlarm = row[COL_RECTIFIER_ALARM]; // Column AJ

        const hasRIF =
          rectifierAlarm &&
          rectifierAlarm.trim() !== "" &&
          rectifierAlarm.toUpperCase() !== "OK" &&
          rectifierAlarm.toUpperCase() !== "NORMAL" &&
          rectifierAlarm.toUpperCase() !== "NO ALARM" &&
          !rectifierAlarm.toLowerCase().includes("no alarm") &&
          rectifierAlarm.toLowerCase().includes("rectifier");

        if (hasRIF) {
          const coordinates = parseCoordinates(row[COL_LAT_LONG]); // AO
          const region = row[COL_REGION] || "Unknown";
          const duration = row[COL_DURATION] || "N/A";
          const remainingFuel = parseFloat(row[COL_REMAINING_FUEL]) || 0;
          const rawSeverity = row[COL_SEVERITY] || "Unknown";
          const normalizedCategory = mapSeverityToCategory(rawSeverity);
          const siteName = row[COL_SITE_NAME] || "Unknown Site";
          const siteId = row[COL_SITE_ID] || "N/A";
          const occurTime = row[COL_OCCUR_TIME] || "N/A";

          alarmSites.push({
            id: siteId,
            name: siteName,
            siteId: siteId,
            region: region,
            duration: duration,
            occurTime: occurTime,
            coordinates: coordinates,
            alarmMessage: rectifierAlarm,
            remainingFuel: remainingFuel,
            siteCategory: normalizedCategory,
            rawSeverity: rawSeverity,
          });

          regionCount[region] = (regionCount[region] || 0) + 1;
          siteCategoryCount[normalizedCategory] =
            (siteCategoryCount[normalizedCategory] || 0) + 1;
        }
      }

      // Fetch weather data for all sites
      const weatherDataMap = await fetchWeatherForSites(alarmSites);
      setWeatherData(weatherDataMap);

      // Add weather data to sites and determine conditions
      const alarmSitesWithWeather = alarmSites.map((site) => {
        const weather = weatherDataMap[site.id] || {
          risk: "Low",
          weatherDesc: "Unknown",
          precipProbability: 0,
          windSpeed: 0,
          temperature: null,
        };
        const condition = getSiteCondition(weather.risk, site.remainingFuel);
        return {
          ...site,
          weatherRisk: weather.risk,
          weatherDesc: weather.weatherDesc,
          precipProbability: weather.precipProbability,
          windSpeed: weather.windSpeed,
          temperature: weather.temperature,
          condition: condition,
        };
      });

      // Calculate site category stats for the cards (using normalized categories)
      const categoryStats = {};
      alarmSitesWithWeather.forEach((site) => {
        const category = site.siteCategory;
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, sites: [] };
        }
        categoryStats[category].count++;
        categoryStats[category].sites.push(site);
      });

      const badWeatherAffected = alarmSitesWithWeather.filter(
        (s) => s.condition === "Bad Weather Affected",
      ).length;
      const lowFuelSites = alarmSitesWithWeather.filter(
        (s) => s.condition === "Low Fuel (<50L)",
      ).length;
      const moderateRiskSites = alarmSitesWithWeather.filter(
        (s) => s.condition === "Moderate Risk",
      ).length;

      setRifAlarms(alarmSitesWithWeather);
      setAlarmStats({
        totalAlarms: alarmSitesWithWeather.length,
        badWeatherAffected: badWeatherAffected,
        lowFuelSites: lowFuelSites,
        moderateRiskSites: moderateRiskSites,
        affectedRegions: Object.keys(regionCount),
        siteCategoryStats: categoryStats,
      });
      setLastUpdated(new Date());

      const firstValidSite = alarmSitesWithWeather.find((s) => s.coordinates);
      if (firstValidSite && firstValidSite.coordinates) {
        setMapCenter([
          firstValidSite.coordinates.lat,
          firstValidSite.coordinates.lng,
        ]);
        setMapZoom(7);
      }
    } catch (error) {
      console.error("Failed to fetch RIF data:", error);

      // Fallback demo data with normalized categories
      const demoAlarms = [
        {
          id: "KHI-001",
          name: "Karachi Central Exchange",
          siteId: "KHI-001",
          region: "C-1",
          duration: "72",
          occurTime: "2024-01-15 08:30:00",
          coordinates: { lat: 24.8607, lng: 67.0011 },
          alarmMessage: "Rectifier Input Failure - Critical",
          condition: "Bad Weather Affected",
          remainingFuel: 1250,
          weatherRisk: "Critical",
          weatherDesc: "Heavy Rain",
          precipProbability: 85,
          windSpeed: 45,
          temperature: 28,
          siteCategory: "Critical Hub (10 ++)",
        },
        {
          id: "LHE-045",
          name: "Lahore Data Center",
          siteId: "LHE-045",
          region: "C-1",
          duration: "48",
          occurTime: "2024-01-15 10:15:00",
          coordinates: { lat: 31.5497, lng: 74.3436 },
          alarmMessage: "Rectifier Input Failure - Major",
          condition: "Low Fuel (<50L)",
          remainingFuel: 35,
          weatherRisk: "Moderate",
          weatherDesc: "Cloudy",
          precipProbability: 30,
          windSpeed: 15,
          temperature: 32,
          siteCategory: "Major Hub (5~10)",
        },
        {
          id: "ISB-089",
          name: "Islamabad Gateway",
          siteId: "ISB-089",
          region: "C-6",
          duration: "6",
          occurTime: "2024-01-15 06:45:00",
          coordinates: { lat: 33.6844, lng: 73.0479 },
          alarmMessage: "Rectifier Input Failure - Minor",
          condition: "Moderate Risk",
          remainingFuel: 3450,
          weatherRisk: "Low",
          weatherDesc: "Clear",
          precipProbability: 5,
          windSpeed: 8,
          temperature: 25,
          siteCategory: "PTN Node",
        },
        {
          id: "RWP-023",
          name: "Rawalpindi Hub",
          siteId: "RWP-023",
          region: "C-1",
          duration: "96",
          occurTime: "2024-01-14 22:00:00",
          coordinates: { lat: 33.5651, lng: 73.0169 },
          alarmMessage: "Rectifier Input Failure - Complete Failure",
          condition: "Bad Weather Affected",
          remainingFuel: 28,
          weatherRisk: "High",
          weatherDesc: "Thunderstorm",
          precipProbability: 90,
          windSpeed: 55,
          temperature: 22,
          siteCategory: "Critical Hub (10 ++)",
        },
        {
          id: "FSD-067",
          name: "Faisalabad Exchange",
          siteId: "FSD-067",
          region: "C-6",
          duration: "24",
          occurTime: "2024-01-15 14:20:00",
          coordinates: { lat: 31.4504, lng: 73.135 },
          alarmMessage: "Rectifier Input Failure - High Priority",
          condition: "Low Fuel (<50L)",
          remainingFuel: 42,
          weatherRisk: "Moderate",
          weatherDesc: "Light Rain",
          precipProbability: 55,
          windSpeed: 20,
          temperature: 30,
          siteCategory: "Major Hub (5~10)",
        },
        {
          id: "MUX-034",
          name: "Multan Node",
          siteId: "MUX-034",
          region: "C-1",
          duration: "2.5",
          occurTime: "2024-01-15 16:10:00",
          coordinates: { lat: 30.1575, lng: 71.5249 },
          alarmMessage: "Rectifier Input Failure - Warning",
          condition: "Moderate Risk",
          remainingFuel: 2100,
          weatherRisk: "Low",
          weatherDesc: "Sunny",
          precipProbability: 0,
          windSpeed: 10,
          temperature: 38,
          siteCategory: "PTN Node",
        },
        {
          id: "PEW-012",
          name: "Peshawar Hub",
          siteId: "PEW-012",
          region: "C-6",
          duration: "120",
          occurTime: "2024-01-14 18:30:00",
          coordinates: { lat: 34.0151, lng: 71.5249 },
          alarmMessage: "Rectifier Input Failure - Critical",
          condition: "Bad Weather Affected",
          remainingFuel: 15,
          weatherRisk: "Critical",
          weatherDesc: "Heavy Rain with Wind",
          precipProbability: 95,
          windSpeed: 65,
          temperature: 18,
          siteCategory: "PTN Node",
        },
      ];

      // Calculate category stats for demo data
      const demoCategoryStats = {};
      demoAlarms.forEach((site) => {
        const category = site.siteCategory;
        if (!demoCategoryStats[category]) {
          demoCategoryStats[category] = { count: 0, sites: [] };
        }
        demoCategoryStats[category].count++;
        demoCategoryStats[category].sites.push(site);
      });

      setRifAlarms(demoAlarms);
      setAlarmStats({
        totalAlarms: demoAlarms.length,
        badWeatherAffected: demoAlarms.filter(
          (s) => s.condition === "Bad Weather Affected",
        ).length,
        lowFuelSites: demoAlarms.filter(
          (s) => s.condition === "Low Fuel (<50L)",
        ).length,
        moderateRiskSites: demoAlarms.filter(
          (s) => s.condition === "Moderate Risk",
        ).length,
        affectedRegions: ["C-1", "C-6"],
        siteCategoryStats: demoCategoryStats,
      });
      setLastUpdated(new Date());
      setMapCenter([30.3753, 69.3451]);
      setMapZoom(5.5);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRIFData();
  }, []);

  // Filter alarms based on selected region only
  const filteredAlarms = React.useMemo(() => {
    return rifAlarms.filter((alarm) => {
      const regionMatch =
        selectedRegion === "All" || alarm.region === selectedRegion;
      return regionMatch;
    });
  }, [rifAlarms, selectedRegion]);

  // Get sites for selected region to show in cards
  const regionSites = React.useMemo(() => {
    return selectedRegion === "All"
      ? rifAlarms
      : rifAlarms.filter((alarm) => alarm.region === selectedRegion);
  }, [rifAlarms, selectedRegion]);

  // Calculate category stats for the selected region (normalized)
  const getRegionCategoryStats = () => {
    const stats = {};
    regionSites.forEach((site) => {
      const category = site.siteCategory;
      if (!stats[category]) {
        stats[category] = { count: 0 };
      }
      stats[category].count++;
    });
    const sortedStats = Object.fromEntries(
      Object.entries(stats).sort((a, b) => a[0].localeCompare(b[0])),
    );
    return sortedStats;
  };

  // Get marker icon based on condition
  const getMarkerIcon = (alarm) => {
    if (alarm.condition === "Bad Weather Affected") {
      return weatherMarkerIcon;
    }
    return redMarkerIcon;
  };

  const getRegionOptions = () => {
    const regions = [
      "All",
      ...new Set(rifAlarms.map((a) => a.region).filter((r) => r !== "Unknown")),
    ];
    return regions;
  };

  // Navigation handlers
  const goToDashboard = () => navigate("/");
  const goToWeatherPage = () => navigate("/weather");
  const goToMap = () => navigate("/map");
  const goToFuelManagement = () => navigate("/fuel-summary");
  const goToDGAutoCheck = () => navigate("/dg-auto-check");

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
      active: false,
      onClick: goToFuelManagement,
    },
    {
      name: "DG Auto Check",
      icon: CheckCircle,
      active: false,
      onClick: goToDGAutoCheck,
    },
    {
      name: "Sites Map",
      icon: Map,
      active: false,
      onClick: goToMap,
    },
    {
      name: "RIF Alarms",
      icon: Zap,
      active: true,
      onClick: null,
    },
  ];

  // Get category color (same as SitesByCategoryTable)
  const getCategoryColor = (category) => {
    if (category === "PTN Node") return "text-cyan-400";
    if (category === "Critical Hub (10 ++)") return "text-red-400";
    if (category === "Major Hub (5~10)") return "text-orange-400";
    if (category === "Minor Hub (1~4)") return "text-yellow-400";
    if (category === "Single/FTTS") return "text-gray-400";
    return "text-blue-400";
  };

  return (
    <div className="h-screen bg-[#0f1325] text-white flex overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:relative z-30 w-72 bg-[#13182b] border-r border-gray-800 p-5 flex flex-col transition-transform duration-300 h-full ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-red-500 p-2 rounded-xl shadow-lg">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">RIF ALARMS</h1>
            <p className="text-gray-400 text-xs">Rectifier Monitoring</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            Navigation
          </div>
          <nav className="space-y-2">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                  item.active
                    ? "bg-red-600/20 text-red-400"
                    : "text-gray-400 hover:bg-[#1a213a]"
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Quick Stats in Sidebar */}
        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="bg-[#0f1325] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">System Status</span>
              <span
                className={`text-xs flex items-center gap-1 ${alarmStats.totalAlarms > 0 ? "text-red-400" : "text-green-400"}`}
              >
                <Circle
                  size={8}
                  fill={alarmStats.totalAlarms > 0 ? "#ef4444" : "#4ade80"}
                  stroke="none"
                />
                {alarmStats.totalAlarms > 0
                  ? `${alarmStats.totalAlarms} Alarms Active`
                  : "All Systems Normal"}
              </span>
            </div>
            <button
              onClick={fetchRIFData}
              className="w-full mt-2 bg-[#1a2142] hover:bg-[#25306b] text-gray-300 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} />
              Refresh Data
            </button>
            {lastUpdated && (
              <p className="text-[10px] text-gray-500 text-center mt-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-[#13182b]/90 backdrop-blur-sm border-b border-gray-800 px-5 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="md:hidden bg-[#1a2142] p-2 rounded-xl text-white"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-red-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Rectifier Input Failure Dashboard
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRIFData}
              className="bg-[#1a2142] hover:bg-[#25306b] p-2 rounded-xl transition-colors"
            >
              <RefreshCw size={16} className="text-gray-400" />
            </button>
            <Bell size={20} className="text-gray-400" />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-gray-400">
                  Loading RIF Alarms & Weather Data...
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Fetching real-time weather from Open-Meteo
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* REGION FILTER */}
              <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Filter size={18} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">
                      Filter by Region:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getRegionOptions().map((region) => (
                      <button
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedRegion === region
                            ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                            : "bg-[#0f1325] text-gray-400 hover:bg-[#1a2142] hover:text-white"
                        }`}
                      >
                        {region}
                        {region !== "All" && (
                          <span className="ml-2 text-xs opacity-75">
                            (
                            {
                              rifAlarms.filter((a) => a.region === region)
                                .length
                            }
                            )
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Showing {filteredAlarms.length} of {rifAlarms.length} sites
                  </div>
                </div>
              </div>

              {/* SUMMARY CARDS SECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Alarms Card */}
                <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-2xl border border-red-500/30 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-300 text-sm">
                        Total Active RIF Alarms
                      </p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {filteredAlarms.length}
                      </p>
                      {selectedRegion !== "All" && (
                        <p className="text-xs text-gray-400 mt-1">
                          in {selectedRegion}
                        </p>
                      )}
                    </div>
                    <div className="bg-red-500/20 p-3 rounded-xl">
                      <Zap size={24} className="text-red-400" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-red-400">
                      ⚠️ Rectifier Failure Detected
                    </span>
                  </div>
                </div>

                {/* Bad Weather Affected Card */}
                <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-2xl border border-blue-500/20 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-300 text-sm">
                        Bad Weather Affected
                      </p>
                      <p className="text-3xl font-bold text-blue-400 mt-1">
                        {
                          regionSites.filter(
                            (s) => s.condition === "Bad Weather Affected",
                          ).length
                        }
                      </p>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded-xl">
                      <CloudRain size={24} className="text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-blue-300">
                    Sites with severe weather impact
                  </div>
                </div>

                {/* Low Fuel Sites Card */}
                <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 rounded-2xl border border-orange-500/20 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-300 text-sm">Low Fuel Sites</p>
                      <p className="text-3xl font-bold text-orange-400 mt-1">
                        {
                          regionSites.filter(
                            (s) => s.condition === "Low Fuel (<50L)",
                          ).length
                        }
                      </p>
                    </div>
                    <div className="bg-orange-500/10 p-3 rounded-xl">
                      <Fuel size={24} className="text-orange-400" />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-orange-300">
                    Remaining Fuel &lt; 50L
                  </div>
                </div>

                {/* Site Category Stats Card */}
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-2xl border border-purple-500/20 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-300 text-sm">Site Categories</p>
                      <p className="text-2xl font-bold text-purple-400 mt-1">
                        {Object.keys(getRegionCategoryStats()).length} Types
                      </p>
                    </div>
                    <div className="bg-purple-500/10 p-3 rounded-xl">
                      <TowerControl size={24} className="text-purple-400" />
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {Object.entries(getRegionCategoryStats()).map(
                      ([category, stats]) => (
                        <div
                          key={category}
                          className="text-xs flex justify-between items-center"
                        >
                          <span
                            className="text-gray-400 truncate max-w-[140px]"
                            title={category}
                          >
                            {category}
                          </span>
                          <span className={getCategoryColor(category)}>
                            {stats.count} sites
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* MAP SECTION */}
              <div className="grid grid-cols-1 gap-5">
                <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 overflow-hidden">
                  <div className="bg-[#0a0f20] px-4 py-2.5 border-b border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Map size={18} className="text-red-400" />
                      <h2 className="font-semibold text-white">
                        RIF ALARMS - SITE MAP{" "}
                        {selectedRegion !== "All" && `(${selectedRegion})`}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-red-400">
                        🔴 {filteredAlarms.filter((a) => a.coordinates).length}{" "}
                        Sites in{" "}
                        {selectedRegion !== "All"
                          ? selectedRegion
                          : "All Regions"}
                      </div>
                    </div>
                  </div>
                  <div className="h-[450px] w-full relative bg-[#0f1325]">
                    <MapContainer
                      key={`rif-map-${selectedRegion}`}
                      center={mapCenter}
                      zoom={mapZoom}
                      style={{
                        height: "100%",
                        width: "100%",
                        background: "#0f1325",
                      }}
                      zoomControl={false}
                      className="leaflet-container"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {/* Dynamic Markers based on region filter */}
                      {filteredAlarms.map(
                        (alarm) =>
                          alarm.coordinates && (
                            <Marker
                              key={alarm.id}
                              position={[
                                alarm.coordinates.lat,
                                alarm.coordinates.lng,
                              ]}
                              icon={getMarkerIcon(alarm)}
                              eventHandlers={{
                                click: () => setSelectedSite(alarm),
                              }}
                            >
                              <Tooltip sticky direction="top" offset={[0, -15]}>
                                <div className="text-sm font-semibold">
                                  {alarm.name}
                                </div>
                                <div className="text-xs flex items-center gap-1 mt-1">
                                  {getConditionIcon(alarm.condition)}
                                  <span
                                    className={
                                      alarm.condition === "Bad Weather Affected"
                                        ? "text-blue-400"
                                        : alarm.condition === "Low Fuel (<50L)"
                                          ? "text-orange-400"
                                          : "text-yellow-400"
                                    }
                                  >
                                    {alarm.condition}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  Fuel: {alarm.remainingFuel.toLocaleString()}L
                                </div>
                                <div className="text-xs">
                                  Weather: {alarm.weatherDesc} (
                                  {alarm.weatherRisk})
                                </div>
                              </Tooltip>
                              <Popup>
                                <div className="text-black min-w-[260px] p-2">
                                  <h4 className="font-bold text-base">
                                    {alarm.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 mt-1">
                                    ID: {alarm.siteId}
                                  </p>

                                  <div
                                    className={`mt-2 p-2 rounded text-xs font-medium ${getConditionColor(alarm.condition)}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {getConditionIcon(alarm.condition)}
                                      <span>Condition: {alarm.condition}</span>
                                    </div>
                                  </div>

                                  <div className="mt-2 space-y-1 text-xs">
                                    <p>
                                      <strong className="text-gray-700">
                                        Alarm:
                                      </strong>
                                      <br />
                                      {alarm.alarmMessage}
                                    </p>
                                    <p>
                                      <strong>Remaining Fuel:</strong>
                                      <span
                                        className={
                                          alarm.remainingFuel < 50
                                            ? "text-red-500 font-bold"
                                            : ""
                                        }
                                      >
                                        {" "}
                                        {alarm.remainingFuel.toLocaleString()} L
                                      </span>
                                    </p>
                                    <p>
                                      <strong>Duration:</strong>
                                      <span
                                        className={getDurationColor(
                                          alarm.duration,
                                        )}
                                      >
                                        {" "}
                                        {formatDuration(alarm.duration)}
                                      </span>
                                    </p>
                                    <p>
                                      <strong>Occur Time:</strong>{" "}
                                      {alarm.occurTime || "N/A"}
                                    </p>

                                    {/* Weather Information Section */}
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <p className="font-semibold text-gray-700">
                                        🌤️ Weather Information
                                      </p>
                                      <p>
                                        <strong>Condition:</strong>{" "}
                                        {alarm.weatherDesc}
                                      </p>
                                      <p>
                                        <strong>Risk Level:</strong>
                                        <span
                                          className={
                                            alarm.weatherRisk === "Critical"
                                              ? "text-red-500 font-bold"
                                              : alarm.weatherRisk === "High"
                                                ? "text-orange-500"
                                                : alarm.weatherRisk ===
                                                    "Moderate"
                                                  ? "text-yellow-500"
                                                  : "text-green-500"
                                          }
                                        >
                                          {" "}
                                          {alarm.weatherRisk}
                                        </span>
                                      </p>
                                      <p>
                                        <strong>Precipitation:</strong>{" "}
                                        {alarm.precipProbability}%
                                      </p>
                                      <p>
                                        <strong>Wind Speed:</strong>{" "}
                                        {alarm.windSpeed} km/h
                                      </p>
                                      <p>
                                        <strong>Temperature:</strong>{" "}
                                        {alarm.temperature}°C
                                      </p>
                                    </div>

                                    <p>
                                      <strong>Region:</strong> {alarm.region}
                                    </p>
                                    <p>
                                      <strong>Site Category:</strong>
                                      <span
                                        className={getCategoryColor(
                                          alarm.siteCategory,
                                        )}
                                      >
                                        {" "}
                                        {alarm.siteCategory}
                                      </span>
                                    </p>
                                  </div>

                                  <button
                                    onClick={() => {
                                      window.open(
                                        `https://www.google.com/maps?q=${alarm.coordinates.lat},${alarm.coordinates.lng}`,
                                        "_blank",
                                      );
                                    }}
                                    className="mt-3 w-full bg-red-500 text-white text-xs py-1.5 rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                                  >
                                    <ExternalLink size={12} />
                                    Open in Google Maps
                                  </button>
                                </div>
                              </Popup>
                            </Marker>
                          ),
                      )}
                      <MapZoomControls />
                    </MapContainer>
                  </div>
                  <div className="px-4 py-2 text-[10px] text-gray-400 flex justify-between border-t border-gray-800 bg-[#0a0f20]">
                    <span>
                      🔴 {filteredAlarms.filter((a) => a.coordinates).length}{" "}
                      sites displayed for{" "}
                      {selectedRegion !== "All"
                        ? selectedRegion
                        : "all regions"}
                    </span>
                    <span>📍 Click markers for weather & site details</span>
                    <span>📊 Weather data from Open-Meteo API</span>
                  </div>
                </div>
              </div>

              {/* ALARMS LIST TABLE */}
              <div className="bg-gradient-to-br from-[#1a2142] to-[#13182b] rounded-2xl border border-gray-700 overflow-hidden">
                <div className="bg-[#0a0f20] px-5 py-3 border-b border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      <FileText size={18} className="text-red-400" />
                      ACTIVE RIF ALARMS{" "}
                      {selectedRegion !== "All" && `- ${selectedRegion}`}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      Real-time weather data from Open-Meteo API
                    </p>
                  </div>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm transition-colors"
                  >
                    <Download size={16} />
                    Export to Excel
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0f1325] border-b border-gray-700">
                      <tr>
                        <th className="p-3 text-left text-gray-400 font-medium text-xs">
                          Site Name
                        </th>
                        <th className="p-3 text-left text-gray-400 font-medium text-xs">
                          Region
                        </th>
                        <th className="p-3 text-left text-gray-400 font-medium text-xs">
                          Duration
                        </th>
                        <th className="p-3 text-left text-gray-400 font-medium text-xs">
                          Occur Time
                        </th>
                        <th className="p-3 text-left text-gray-400 font-medium text-xs">
                          Weather
                        </th>
                        <th className="p-3 text-left text-gray-400 font-medium text-xs">
                          Alarm Message
                        </th>
                        <th className="p-3 text-right text-gray-400 font-medium text-xs">
                          Remaining Fuel
                        </th>
                        <th className="p-3 text-left text-gray-400 font-medium text-xs">
                          Category
                        </th>
                        <th className="p-3 text-center text-gray-400 font-medium text-xs">
                          Weather Risk
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredAlarms.length === 0 ? (
                        <tr>
                          <td
                            colSpan="9"
                            className="p-8 text-center text-gray-400"
                          >
                            <CheckCircle
                              size={32}
                              className="mx-auto mb-2 text-green-500"
                            />
                            <p>
                              No active RIF alarms found for{" "}
                              {selectedRegion !== "All"
                                ? selectedRegion
                                : "this region"}
                            </p>
                            <p className="text-xs mt-1">
                              All rectifiers are operating normally
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredAlarms.map((alarm) => (
                          <tr
                            key={alarm.id}
                            className="hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => {
                              if (alarm.coordinates) {
                                setMapCenter([
                                  alarm.coordinates.lat,
                                  alarm.coordinates.lng,
                                ]);
                                setMapZoom(14);
                                setSelectedSite(alarm);
                              }
                            }}
                          >
                            <td className="p-3 text-white font-medium">
                              {alarm.name}
                              <p className="text-xs text-gray-500">
                                {alarm.siteId}
                              </p>
                            </td>
                            <td className="p-3 text-gray-300">
                              {alarm.region}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Hourglass
                                  size={14}
                                  className={getDurationColor(alarm.duration)}
                                />
                                <span
                                  className={`text-sm font-mono ${getDurationColor(alarm.duration)}`}
                                >
                                  {formatDuration(alarm.duration)}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-gray-300 text-xs">
                              {alarm.occurTime || "N/A"}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                {alarm.weatherRisk === "Critical" ? (
                                  <CloudRain
                                    size={14}
                                    className="text-red-400"
                                  />
                                ) : alarm.weatherRisk === "High" ? (
                                  <CloudRain
                                    size={14}
                                    className="text-orange-400"
                                  />
                                ) : alarm.weatherRisk === "Moderate" ? (
                                  <CloudRain
                                    size={14}
                                    className="text-yellow-400"
                                  />
                                ) : (
                                  <CloudRain
                                    size={14}
                                    className="text-green-400"
                                  />
                                )}
                                <span className="text-xs text-gray-300">
                                  {alarm.weatherDesc}
                                </span>
                              </div>
                            </td>
                            <td
                              className="p-3 text-gray-300 max-w-xs truncate"
                              title={alarm.alarmMessage}
                            >
                              {alarm.alarmMessage.length > 40
                                ? `${alarm.alarmMessage.substring(0, 40)}...`
                                : alarm.alarmMessage}
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={
                                  alarm.remainingFuel < 50
                                    ? "text-red-400 font-bold text-base"
                                    : "text-gray-300"
                                }
                              >
                                {alarm.remainingFuel.toLocaleString()} L
                              </span>
                              {alarm.remainingFuel < 50 && (
                                <div className="text-[10px] text-red-400">
                                  CRITICAL
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(alarm.siteCategory)} bg-opacity-10`}
                              >
                                {alarm.siteCategory}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {alarm.weatherRisk === "Critical" ||
                                alarm.weatherRisk === "High" ? (
                                  <>
                                    <CloudRain
                                      size={14}
                                      className="text-red-400"
                                    />
                                    <span className="text-xs text-red-400">
                                      Severe
                                    </span>
                                  </>
                                ) : alarm.weatherRisk === "Moderate" ? (
                                  <>
                                    <AlertTriangle
                                      size={14}
                                      className="text-yellow-400"
                                    />
                                    <span className="text-xs text-yellow-400">
                                      Moderate
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle
                                      size={14}
                                      className="text-green-400"
                                    />
                                    <span className="text-xs text-green-400">
                                      Low
                                    </span>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default RIFDashboard;
