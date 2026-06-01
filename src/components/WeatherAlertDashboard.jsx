// WeatherAlertDashboard.jsx - 7-DAY WEATHER FORECAST WITH FUEL ALERTS
// Includes detailed weather metrics: precipitation (mm), wind speed (km/h), temperature (°C)

import React, { useState, useEffect, useRef } from 'react';
import { fetchGoogleSheetData } from '/backend/GoogleSheetApi';
import { AlertTriangle, Droplets, Wind, CloudRain, Snowflake, Zap, Sun, Cloud, MapPin, Calendar, Clock, Fuel, ChevronLeft, ChevronRight, Thermometer, Gauge } from 'lucide-react';

const WeatherAlertDashboard = () => {
  // State variables
  const [sites, setSites] = useState([]);
  const [allSitesWithWeather, setAllSitesWithWeather] = useState([]);
  const [criticalSites, setCriticalSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [masterData, setMasterData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1); // 0=today, 1=tomorrow, 2=day3, etc.
  const [weeklyForecast, setWeeklyForecast] = useState([]);
  
  const isFetchingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  // Weather codes and their mappings with detailed metrics
  const WEATHER_TYPES = {
    0: { type: 'Clear Sky', icon: <Sun size={16} />, color: 'yellow', risk: 'Low', metricLabel: 'Clear sky' },
    1: { type: 'Mainly Clear', icon: <Cloud size={16} />, color: 'gray', risk: 'Low', metricLabel: 'Mostly clear' },
    2: { type: 'Partly Cloudy', icon: <Cloud size={16} />, color: 'gray', risk: 'Low', metricLabel: 'Partly cloudy' },
    3: { type: 'Overcast', icon: <Cloud size={16} />, color: 'gray', risk: 'Low', metricLabel: 'Cloud cover' },
    45: { type: 'Fog', icon: <Droplets size={16} />, color: 'gray', risk: 'Low', metricLabel: 'Visibility reduced' },
    48: { type: 'Depositing Rime Fog', icon: <Droplets size={16} />, color: 'gray', risk: 'Low', metricLabel: 'Ice fog' },
    51: { type: 'Light Drizzle', icon: <Droplets size={16} />, color: 'blue', risk: 'Low', metricLabel: 'Rainfall rate', metricUnit: 'mm/h', typicalMin: 0.2, typicalMax: 0.5 },
    53: { type: 'Moderate Drizzle', icon: <Droplets size={16} />, color: 'blue', risk: 'Moderate', metricLabel: 'Rainfall rate', metricUnit: 'mm/h', typicalMin: 0.5, typicalMax: 1.0 },
    55: { type: 'Heavy Drizzle', icon: <Droplets size={16} />, color: 'blue', risk: 'Moderate', metricLabel: 'Rainfall rate', metricUnit: 'mm/h', typicalMin: 1.0, typicalMax: 2.0 },
    61: { type: 'Light Rain', icon: <CloudRain size={16} />, color: 'blue', risk: 'Moderate', metricLabel: 'Rainfall', metricUnit: 'mm', typicalMin: 0.5, typicalMax: 4.0 },
    62: { type: 'Moderate Rain', icon: <CloudRain size={16} />, color: 'blue', risk: 'High', metricLabel: 'Rainfall', metricUnit: 'mm', typicalMin: 4.0, typicalMax: 15.0 },
    63: { type: 'Heavy Rain', icon: <CloudRain size={16} />, color: 'blue', risk: 'High', metricLabel: 'Rainfall', metricUnit: 'mm', typicalMin: 15.0, typicalMax: 30.0 },
    64: { type: 'Very Heavy Rain', icon: <CloudRain size={16} />, color: 'blue', risk: 'High', metricLabel: 'Rainfall', metricUnit: 'mm', typicalMin: 30.0, typicalMax: 60.0 },
    65: { type: 'Extreme Rain', icon: <CloudRain size={16} />, color: 'purple', risk: 'Critical', metricLabel: 'Rainfall', metricUnit: 'mm', typicalMin: 60.0, typicalMax: 120.0 },
    66: { type: 'Freezing Rain', icon: <CloudRain size={16} />, color: 'purple', risk: 'Critical', metricLabel: 'Ice accumulation', metricUnit: 'mm', typicalMin: 1.0, typicalMax: 10.0 },
    67: { type: 'Heavy Freezing Rain', icon: <CloudRain size={16} />, color: 'purple', risk: 'Critical', metricLabel: 'Ice accumulation', metricUnit: 'mm', typicalMin: 10.0, typicalMax: 25.0 },
    71: { type: 'Light Snow', icon: <Snowflake size={16} />, color: 'cyan', risk: 'Moderate', metricLabel: 'Snowfall', metricUnit: 'cm', typicalMin: 1.0, typicalMax: 5.0 },
    72: { type: 'Moderate Snow', icon: <Snowflake size={16} />, color: 'cyan', risk: 'High', metricLabel: 'Snowfall', metricUnit: 'cm', typicalMin: 5.0, typicalMax: 15.0 },
    73: { type: 'Heavy Snow', icon: <Snowflake size={16} />, color: 'cyan', risk: 'High', metricLabel: 'Snowfall', metricUnit: 'cm', typicalMin: 15.0, typicalMax: 30.0 },
    74: { type: 'Very Heavy Snow', icon: <Snowflake size={16} />, color: 'purple', risk: 'Critical', metricLabel: 'Snowfall', metricUnit: 'cm', typicalMin: 30.0, typicalMax: 60.0 },
    75: { type: 'Extreme Snow', icon: <Snowflake size={16} />, color: 'purple', risk: 'Critical', metricLabel: 'Snowfall', metricUnit: 'cm', typicalMin: 60.0, typicalMax: 100.0 },
    77: { type: 'Snow Grains', icon: <Snowflake size={16} />, color: 'cyan', risk: 'Moderate', metricLabel: 'Snow grains', metricUnit: 'cm', typicalMin: 0.5, typicalMax: 2.0 },
    80: { type: 'Light Rain Showers', icon: <CloudRain size={16} />, color: 'blue', risk: 'Moderate', metricLabel: 'Rainfall', metricUnit: 'mm', typicalMin: 0.5, typicalMax: 5.0 },
    81: { type: 'Moderate Rain Showers', icon: <CloudRain size={16} />, color: 'blue', risk: 'High', metricLabel: 'Rainfall', metricUnit: 'mm', typicalMin: 5.0, typicalMax: 15.0 },
    82: { type: 'Violent Rain Showers', icon: <CloudRain size={16} />, color: 'purple', risk: 'Critical', metricLabel: 'Rainfall', metricUnit: 'mm', typicalMin: 15.0, typicalMax: 40.0 },
    85: { type: 'Light Snow Showers', icon: <Snowflake size={16} />, color: 'cyan', risk: 'Moderate', metricLabel: 'Snowfall', metricUnit: 'cm', typicalMin: 1.0, typicalMax: 4.0 },
    86: { type: 'Heavy Snow Showers', icon: <Snowflake size={16} />, color: 'purple', risk: 'High', metricLabel: 'Snowfall', metricUnit: 'cm', typicalMin: 4.0, typicalMax: 12.0 },
    95: { type: 'Thunderstorm', icon: <Zap size={16} />, color: 'purple', risk: 'Critical', metricLabel: 'Storm intensity', metricUnit: 'level', typicalMin: 1, typicalMax: 3 },
    96: { type: 'Thunderstorm with Hail', icon: <Zap size={16} />, color: 'purple', risk: 'Critical', metricLabel: 'Hail size', metricUnit: 'cm', typicalMin: 1.0, typicalMax: 3.0 },
    99: { type: 'Severe Thunderstorm', icon: <Zap size={16} />, color: 'red', risk: 'Critical', metricLabel: 'Severe storm', metricUnit: 'level', typicalMin: 3, typicalMax: 5 }
  };

  const getWeatherInfo = (code) => {
    return WEATHER_TYPES[code] || { 
      type: 'Unknown', 
      icon: <CloudRain size={16} />, 
      color: 'gray', 
      risk: 'Unknown',
      metricLabel: 'Conditions',
      metricUnit: ''
    };
  };

  // Helper to format weather metric quantity based on weather code and actual API value
  const formatWeatherQuantity = (weatherCode, actualValue, valueType) => {
    if (!weatherCode) return '—';
    
    const weatherInfo = getWeatherInfo(weatherCode);
    const unit = weatherInfo.metricUnit || '';
    
    if (valueType === 'precipitation' && actualValue !== undefined) {
      // Precipitation is already in mm from API
      if (actualValue === 0) return 'No precipitation';
      if (actualValue < 1) return `${actualValue.toFixed(1)} mm (light)`;
      if (actualValue < 10) return `${actualValue.toFixed(1)} mm (moderate)`;
      if (actualValue < 30) return `${actualValue.toFixed(1)} mm (heavy)`;
      return `${actualValue.toFixed(1)} mm (extreme)`;
    }
    
    if (valueType === 'windSpeed' && actualValue !== undefined) {
      if (actualValue < 10) return `${actualValue.toFixed(1)} km/h (light breeze)`;
      if (actualValue < 30) return `${actualValue.toFixed(1)} km/h (moderate breeze)`;
      if (actualValue < 50) return `${actualValue.toFixed(1)} km/h (strong wind)`;
      if (actualValue < 70) return `${actualValue.toFixed(1)} km/h (gale)`;
      return `${actualValue.toFixed(1)} km/h (storm force)`;
    }
    
    if (valueType === 'temperature') {
      if (actualValue !== undefined) return `${actualValue.toFixed(1)}°C`;
      return '—';
    }
    
    // For display of typical range if no actual value
    if (weatherInfo.typicalMin && weatherInfo.typicalMax) {
      return `${weatherInfo.typicalMin}–${weatherInfo.typicalMax} ${unit}`;
    }
    
    return weatherInfo.metricLabel;
  };

  const getTimePeriod = (hour) => {
    if (hour >= 5 && hour < 12) return 'Morning (05:00-12:00)';
    if (hour >= 12 && hour < 17) return 'Afternoon (12:00-17:00)';
    if (hour >= 17 && hour < 21) return 'Evening (17:00-21:00)';
    return 'Night (21:00-05:00)';
  };

  const parseCoordinates = (coordinateString) => {
    if (!coordinateString || typeof coordinateString !== 'string') {
      return null;
    }
    
    const parts = coordinateString.trim().split(',');
    
    if (parts.length !== 2) return null;
    
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    
    if (isNaN(lat) || isNaN(lng)) return null;
    
    return { latitude: lat, longitude: lng };
  };

  const getSiteFuel = (siteName) => {
    const site = masterData.find(row => row[0] === siteName);
    if (site && site[8]) {
      const fuel = parseFloat(site[8]);
      return isNaN(fuel) ? 0 : fuel;
    }
    return 0;
  };

  const getSiteId = (siteName) => {
    const site = masterData.find(row => row[0] === siteName);
    return site ? site[0] : 'N/A';
  };

  const getSiteRegion = (siteName) => {
    const site = masterData.find(row => row[0] === siteName);
    return site && site[6] ? site[6] : 'Unknown';
  };

  // Get 7-day forecast
  const get7DayForecast = async (latitude, longitude) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,precipitation_hours&timezone=auto&forecast_days=7`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`7-day forecast failed:`, error.message);
      return null;
    }
  };

  // Analyze daily weather for a specific day with detailed metrics
  const analyzeDailyWeather = (dailyData, dayIndex) => {
    if (!dailyData || !dailyData.time || dayIndex >= dailyData.time.length) return null;
    
    const weatherCode = dailyData.weathercode[dayIndex];
    const weatherInfo = getWeatherInfo(weatherCode);
    const precipitation = dailyData.precipitation_sum?.[dayIndex] || 0;
    const windSpeed = dailyData.windspeed_10m_max?.[dayIndex] || 0;
    
    return {
      date: dailyData.time[dayIndex],
      weatherType: weatherInfo.type,
      severity: weatherInfo.risk,
      icon: weatherInfo.icon,
      color: weatherInfo.color,
      maxTemp: dailyData.temperature_2m_max?.[dayIndex],
      minTemp: dailyData.temperature_2m_min?.[dayIndex],
      precipitation: precipitation,
      windSpeed: windSpeed,
      risk: weatherInfo.risk,
      weatherCode: weatherCode,
      // Formatted quantities for display
      precipitationFormatted: formatWeatherQuantity(weatherCode, precipitation, 'precipitation'),
      windFormatted: formatWeatherQuantity(weatherCode, windSpeed, 'windSpeed'),
      tempRangeFormatted: `${dailyData.temperature_2m_min?.[dayIndex]?.toFixed(0) || '?'}°C – ${dailyData.temperature_2m_max?.[dayIndex]?.toFixed(0) || '?'}°C`
    };
  };

  const checkSiteWeather7Day = async (site) => {
    if (!site.coordinates) {
      return { ...site, weeklyWeather: [] };
    }

    const { latitude, longitude } = site.coordinates;
    
    try {
      const dailyForecast = await get7DayForecast(latitude, longitude);
      
      if (!dailyForecast) {
        throw new Error('No forecast data');
      }
      
      const weeklyWeather = [];
      for (let i = 0; i < 7; i++) {
        const dailyWeather = analyzeDailyWeather(dailyForecast, i);
        if (dailyWeather) {
          weeklyWeather.push(dailyWeather);
        }
      }
      
      const fuelLevel = getSiteFuel(site.name);
      
      // Check which days have bad weather (Moderate, High, Critical)
      const badWeatherDays = weeklyWeather.filter(day => 
        ['Moderate', 'High', 'Critical'].includes(day.severity)
      );
      
      return {
        ...site,
        weeklyWeather,
        hasBadWeather: badWeatherDays.length > 0,
        badWeatherDays: badWeatherDays,
        fuelLevel: fuelLevel,
        siteId: getSiteId(site.name),
        region: getSiteRegion(site.name)
      };
    } catch (error) {
      console.error(`Weather failed for ${site.name}:`, error.message);
      return { 
        ...site, 
        weeklyWeather: [],
        hasBadWeather: false,
        badWeatherDays: [],
        fuelLevel: getSiteFuel(site.name), 
        siteId: getSiteId(site.name),
        region: getSiteRegion(site.name)
      };
    }
  };

  const fetchSitesFromGoogleSheets = async () => {
    try {
      const rows = await fetchGoogleSheetData("Master Sheet", "A:U");
      
      if (!rows || rows.length === 0) {
        throw new Error('No data found');
      }
      
      setMasterData(rows.slice(1));
      const dataRows = rows.slice(1);
      const coordinatesColIndex = 17; // Column R
      const siteNameColIndex = 0; // Column A
      
      const parsedSites = dataRows
        .filter(row => row[coordinatesColIndex] && row[coordinatesColIndex].trim())
        .map((row, index) => ({
          name: row[siteNameColIndex] || `Site ${index + 1}`,
          coordinatesRaw: row[coordinatesColIndex],
          coordinates: parseCoordinates(row[coordinatesColIndex]),
        }))
        .filter(site => site.coordinates !== null);
      
      if (parsedSites.length === 0) {
        throw new Error('No valid coordinates found');
      }
      
      return parsedSites;
    } catch (error) {
      console.error('Failed to fetch from Google Sheets:', error);
      throw error;
    }
  };

  const loadWeatherData = async () => {
    if (isFetchingRef.current) {
      console.log('Weather fetch already in progress, skipping...');
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    
    try {
      const fetchedSites = await fetchSitesFromGoogleSheets();
      setSites(fetchedSites);
      
      const sitesWithWeather = [];
      
      const concurrencyLimit = 5;
      for (let i = 0; i < fetchedSites.length; i += concurrencyLimit) {
        const batch = fetchedSites.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(batch.map(site => checkSiteWeather7Day(site)));
        sitesWithWeather.push(...batchResults);
        
        if (i + concurrencyLimit < fetchedSites.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setAllSitesWithWeather(sitesWithWeather);
      
      // Filter sites with bad weather AND fuel level < 50L
      const critical = sitesWithWeather.filter(site => 
        site.hasBadWeather === true && site.fuelLevel < 50
      );
      setCriticalSites(critical);
      
      // Generate weekly forecast summary
      const weeklySummary = generateWeeklySummary(sitesWithWeather);
      setWeeklyForecast(weeklySummary);
      
      setLastUpdated(new Date());
      setError(null);
      
      console.log(`Total sites: ${sitesWithWeather.length}`);
      console.log(`Critical (bad weather + fuel < 50L): ${critical.length}`);
      
    } catch (err) {
      console.error('Error loading weather data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  const generateWeeklySummary = (sitesData) => {
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const summary = [];
    
    for (let day = 0; day < 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      const dayName = weekDays[date.getDay()];
      const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      
      const sitesAffected = sitesData.filter(site => {
        const dayWeather = site.weeklyWeather[day];
        return dayWeather && ['Moderate', 'High', 'Critical'].includes(dayWeather.severity);
      });
      
      const criticalFuelSites = sitesAffected.filter(site => site.fuelLevel < 50);
      
      summary.push({
        dayIndex: day,
        dayName,
        date: dateStr,
        fullDate: date,
        sitesAffected: sitesAffected.length,
        criticalSites: criticalFuelSites.length,
        sites: sitesAffected
      });
    }
    
    return summary;
  };

  useEffect(() => {
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      loadWeatherData();
    }
    
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing weather data...');
      loadWeatherData();
    }, 60 * 60 * 1000); // Update every hour
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Moderate': return 'bg-yellow-500 text-black';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskBadge = (risk) => {
    const colorClass = getRiskColor(risk);
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
        {risk}
      </span>
    );
  };

  const getFuelStatusColor = (fuelLevel) => {
    if (fuelLevel < 50) return 'text-red-400 bg-red-500/20 border-red-500/50';
    if (fuelLevel < 100) return 'text-orange-400 bg-orange-500/20';
    if (fuelLevel < 200) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-green-400 bg-green-500/20';
  };

  const getDateLabel = (dayOffset) => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDayNames = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        offset: i,
        name: date.toLocaleDateString('en-GB', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      });
    }
    return days;
  };

  if (isLoading && sites.length === 0) {
    return (
      <div className="bg-[#171c33] rounded-2xl border border-gray-800 p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading 7-day weather forecast for all sites...</p>
          <p className="text-gray-500 text-xs mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error && sites.length === 0) {
    return (
      <div className="bg-[#171c33] rounded-2xl border border-gray-800 p-8">
        <div className="text-center">
          <div className="text-yellow-500 text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-semibold text-white mb-2">Weather Alert Unavailable</h3>
          <p className="text-gray-400 text-sm">{error}</p>
          <button 
            onClick={() => {
              setIsLoading(true);
              setError(null);
              loadWeatherData();
            }}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const days = getDayNames();
  const currentDayWeather = criticalSites.filter(site => {
    const dayWeather = site.weeklyWeather[selectedDay];
    return dayWeather && ['Moderate', 'High', 'Critical'].includes(dayWeather.severity);
  });

  return (
    <div className="bg-[#171c33] rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 p-6 border-b border-gray-800">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar size={24} className="text-red-400" />
              7-DAY WEATHER & FUEL ALERT DASHBOARD
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Showing sites affected by bad weather AND remaining fuel less than 50 Liters for the next 7 days
            </p>
          </div>
          {lastUpdated && (
            <div className="bg-[#0f1325] px-4 py-2 rounded-lg text-xs text-gray-400">
              <Clock size={12} className="inline mr-1" />
              Last Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Overview Cards */}
      <div className="p-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-blue-400" />
          7-Day Weather Impact Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {weeklyForecast.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDay(day.dayIndex)}
              className={`p-3 rounded-xl text-center transition-all ${
                selectedDay === day.dayIndex 
                  ? 'bg-red-500/20 border-2 border-red-500' 
                  : 'bg-[#0f1325] border border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="text-xs text-gray-400">{day.dayName}</div>
              <div className="text-sm font-bold text-white mt-1">{day.date}</div>
              <div className={`text-lg font-bold mt-2 ${day.criticalSites > 0 ? 'text-red-400' : day.sitesAffected > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {day.criticalSites > 0 ? day.criticalSites : day.sitesAffected}
              </div>
              <div className="text-[10px] text-gray-500">
                {day.criticalSites > 0 ? 'Critical' : day.sitesAffected > 0 ? 'Affected' : 'Clear'}
              </div>
              {day.criticalSites > 0 && (
                <div className="mt-1 w-2 h-2 bg-red-500 rounded-full mx-auto animate-pulse"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CRITICAL ALERT Banner */}
      {criticalSites.length > 0 && (
        <div className="bg-red-600/20 border-l-4 border-red-600 p-5 m-6 rounded-lg animate-pulse">
          <div className="flex items-start gap-3">
            <AlertTriangle size={28} className="text-red-500 flex-shrink-0" />
            <div>
              <h3 className="text-red-500 font-bold text-xl">
                ⚠️ CRITICAL ALERT: {criticalSites.length} Site{criticalSites.length !== 1 ? 's' : ''} Require Immediate Attention
              </h3>
              <p className="text-gray-300 text-sm mt-2">
                These sites are facing bad weather conditions AND have critically low fuel levels (&lt;50L) in the next 7 days.
                Immediate fuel dispatch and emergency protocols required.
              </p>
              <p className="text-yellow-400 text-xs mt-2">
                Most affected day: {weeklyForecast.reduce((max, day) => day.criticalSites > max.criticalSites ? day : max, weeklyForecast[0])?.dayName} ({weeklyForecast.find(d => d.criticalSites === Math.max(...weeklyForecast.map(w => w.criticalSites)))?.date})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6">
        <div className="bg-[#0f1325] rounded-xl p-4 text-center border border-gray-700">
          <div className="text-3xl font-bold text-white">{sites.length}</div>
          <div className="text-gray-400 text-sm">Total Sites</div>
        </div>
        <div className="bg-[#0f1325] rounded-xl p-4 text-center border border-orange-500/30">
          <div className="text-3xl font-bold text-orange-400">
            {allSitesWithWeather.filter(s => s.hasBadWeather).length}
          </div>
          <div className="text-gray-400 text-sm">Sites with Bad Weather (7 days)</div>
        </div>
        <div className="bg-[#0f1325] rounded-xl p-4 text-center border border-red-500/30">
          <div className="text-3xl font-bold text-red-400">{criticalSites.length}</div>
          <div className="text-gray-400 text-sm">Critical (Weather + Low Fuel)</div>
        </div>
        <div className="bg-[#0f1325] rounded-xl p-4 text-center border border-yellow-500/30">
          <div className="text-3xl font-bold text-yellow-400">
            {criticalSites.filter(s => s.badWeatherDays.some(d => d.severity === 'Critical')).length}
          </div>
          <div className="text-gray-400 text-sm">Critical Weather Risk Sites</div>
        </div>
        <div className="bg-[#0f1325] rounded-xl p-4 text-center border border-purple-500/30">
          <div className="text-3xl font-bold text-purple-400">
            {sites.filter(s => s.fuelLevel < 50).length}
          </div>
          <div className="text-gray-400 text-sm">Low Fuel Sites (&lt;50L)</div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="px-6 pb-2">
        <div className="flex items-center justify-between bg-[#0f1325] rounded-lg p-2">
          <button
            onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
            disabled={selectedDay === 0}
            className="p-2 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{days[selectedDay]?.name}</div>
            <div className="text-xs text-gray-400">{getDateLabel(selectedDay)}</div>
          </div>
          <button
            onClick={() => setSelectedDay(Math.min(6, selectedDay + 1))}
            disabled={selectedDay === 6}
            className="p-2 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Critical Sites Table for Selected Day */}
      <div className="px-6 pb-6">
        <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
          <Fuel size={18} className="text-red-400" />
          CRITICAL SITES for {days[selectedDay]?.name} ({getDateLabel(selectedDay)})
        </h3>
        
        {currentDayWeather.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0f1325] sticky top-0">
                <tr>
                  <th className="text-left p-3 text-gray-400 font-medium">Site Name / ID</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Region</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Remaining Fuel</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Weather Type</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Risk Level</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Temperature</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Rain / Snow</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Wind Speed</th>
                  <th className="text-left p-3 text-gray-400 font-medium">Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {currentDayWeather
                  .sort((a, b) => {
                    const riskOrder = { 'Critical': 0, 'High': 1, 'Moderate': 2 };
                    const aRisk = a.weeklyWeather[selectedDay]?.severity || 'Low';
                    const bRisk = b.weeklyWeather[selectedDay]?.severity || 'Low';
                    return (riskOrder[aRisk] || 3) - (riskOrder[bRisk] || 3);
                  })
                  .map((site, index) => {
                    const weather = site.weeklyWeather[selectedDay];
                    if (!weather) return null;
                    
                    // Format the precipitation quantity with units
                    const getPrecipitationDisplay = () => {
                      if (weather.precipitation > 0) {
                        if (weather.weatherType.includes('Snow') || weather.weatherCode.toString().startsWith('7')) {
                          return `${weather.precipitation.toFixed(1)} cm snow`;
                        }
                        return `${weather.precipitation.toFixed(1)} mm rain`;
                      }
                      return 'None';
                    };
                    
                    // Determine what kind of weather metric to highlight
                    const getWeatherMetricHighlight = () => {
                      if (weather.precipitation > 0) {
                        return {
                          label: weather.weatherType.includes('Snow') ? 'Snowfall' : 'Rainfall',
                          value: weather.weatherType.includes('Snow') ? `${weather.precipitation.toFixed(1)} cm` : `${weather.precipitation.toFixed(1)} mm`,
                          severity: weather.severity
                        };
                      }
                      if (weather.windSpeed > 30) {
                        return {
                          label: 'Wind Gust',
                          value: `${weather.windSpeed.toFixed(1)} km/h`,
                          severity: weather.windSpeed > 60 ? 'Critical' : (weather.windSpeed > 40 ? 'High' : 'Moderate')
                        };
                      }
                      return null;
                    };
                    
                    const weatherMetric = getWeatherMetricHighlight();
                    
                    return (
                      <tr key={index} className="border-t border-gray-800 hover:bg-red-500/10 transition-colors bg-red-900/20">
                        <td className="p-3">
                          <div className="font-mono text-xs text-gray-300">{site.siteId}</div>
                          <div className="text-white font-medium">{site.name}</div>
                          <div className="text-gray-500 text-xs mt-1">
                            <MapPin size={10} className="inline mr-1" />
                            {site.coordinates?.latitude.toFixed(4)}, {site.coordinates?.longitude.toFixed(4)}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-gray-300 text-sm">{site.region}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getFuelStatusColor(site.fuelLevel)}`}>
                              <Fuel size={12} className="mr-1" />
                              {site.fuelLevel.toFixed(0)} Liters
                            </div>
                            <div className="text-red-400 text-xs mt-1 font-bold animate-pulse">
                              ⚠️ CRITICAL LEVEL (&lt;50L)
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`text-${weather.color}-400`}>
                              {weather.icon}
                            </div>
                            <div>
                              <span className="text-gray-200 text-sm">{weather.weatherType}</span>
                              {weatherMetric && (
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  {weatherMetric.label}: {weatherMetric.value}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {getRiskBadge(weather.severity)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Thermometer size={12} className="text-gray-400" />
                            <span className="text-gray-300 text-sm">{weather.tempRangeFormatted}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {weather.precipitation > 0 ? (
                              weather.weatherType.includes('Snow') ? 
                                <Snowflake size={12} className="text-cyan-400" /> : 
                                <CloudRain size={12} className="text-blue-400" />
                            ) : (
                              <Droplets size={12} className="text-gray-500" />
                            )}
                            <span className="text-gray-300 text-sm">
                              {getPrecipitationDisplay()}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Wind size={12} className="text-gray-400" />
                            <span className="text-gray-300 text-sm">
                              {weather.windSpeed > 0 ? `${weather.windSpeed.toFixed(1)} km/h` : 'Calm'}
                            </span>
                          </div>
                          {weather.windSpeed > 50 && (
                            <div className="text-orange-400 text-[10px] mt-0.5 font-bold">
                              ⚠️ High wind alert
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="space-y-2">
                            <button className="w-full px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs transition font-bold">
                              🚨 Dispatch Fuel Now
                            </button>
                            <button className="w-full px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-xs transition">
                              View 7-Day Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot className="bg-[#0f1325] border-t border-gray-700">
                <tr>
                  <td colSpan="9" className="p-3 text-center">
                    <div className="flex justify-center gap-4 text-xs">
                      <span className="text-red-400">🔴 Critical: Immediate action required</span>
                      <span className="text-orange-400">🟠 High: Dispatch fuel within 6 hours</span>
                      <span className="text-yellow-400">🟡 Moderate: Monitor and prepare</span>
                    </div>
                   </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
            <div className="text-green-400 text-4xl mb-3">✅</div>
            <h3 className="text-green-400 font-bold text-lg">No Critical Sites for {days[selectedDay]?.name}</h3>
            <p className="text-gray-400 text-sm mt-2">
              No sites with both bad weather conditions AND fuel level below 50L were found for this day.
            </p>
          </div>
        )}
      </div>

      {/* 7-Day Weather Forecast for Each Critical Site with Detailed Metrics */}
      {criticalSites.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-blue-400" />
            7-Day Weather Forecast for Critical Sites (with detailed metrics)
          </h3>
          
          {criticalSites.map((site, idx) => (
            <div key={idx} className="bg-[#0f1325] rounded-xl p-4 mb-4 border border-gray-700">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <div className="text-white font-bold">{site.name}</div>
                  <div className="text-gray-400 text-xs">ID: {site.siteId} | Region: {site.region}</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold mt-2 ${getFuelStatusColor(site.fuelLevel)}`}>
                    <Fuel size={12} className="mr-1" />
                    Current Fuel: {site.fuelLevel.toFixed(0)} Liters
                  </div>
                </div>
                <div className="text-red-400 text-xs font-bold animate-pulse">
                  ⚠️ CRITICAL - Needs Fuel
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 mt-3 overflow-x-auto min-w-full">
                {site.weeklyWeather.map((day, dayIdx) => (
                  <div key={dayIdx} className="text-center p-2 rounded-lg bg-[#171c33] min-w-[90px]">
                    <div className="text-[10px] text-gray-400 font-bold">
                      {new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short' })}
                    </div>
                    <div className="text-[10px] text-gray-500">{day.date.split('-')[2]}/{day.date.split('-')[1]}</div>
                    <div className={`text-${day.color}-400 my-1`}>{day.icon}</div>
                    <div className="text-[11px] text-white font-medium truncate" title={day.weatherType}>
                      {day.weatherType.substring(0, 12)}
                    </div>
                    
                    {/* Detailed metrics section */}
                    <div className="mt-2 pt-2 border-t border-gray-700 text-[10px]">
                      <div className="flex items-center justify-center gap-1 text-gray-300">
                        <Thermometer size={8} />
                        <span>{day.tempRangeFormatted}</span>
                      </div>
                      
                      {day.precipitation > 0 && (
                        <div className="flex items-center justify-center gap-1 text-blue-300 mt-1">
                          {day.weatherType.includes('Snow') ? <Snowflake size={8} /> : <CloudRain size={8} />}
                          <span>
                            {day.weatherType.includes('Snow') ? 
                              `${day.precipitation.toFixed(1)} cm` : 
                              `${day.precipitation.toFixed(1)} mm`}
                          </span>
                        </div>
                      )}
                      
                      {day.windSpeed > 10 && (
                        <div className="flex items-center justify-center gap-1 text-gray-400 mt-1">
                          <Wind size={8} />
                          <span>{day.windSpeed.toFixed(0)} km/h</span>
                        </div>
                      )}
                    </div>
                    
                    <div className={`text-[10px] font-bold mt-1 ${
                      day.severity === 'Critical' ? 'text-red-400' :
                      day.severity === 'High' ? 'text-orange-400' :
                      day.severity === 'Moderate' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {day.severity}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Summary of worst weather in 7 days */}
              <div className="mt-3 pt-2 border-t border-gray-700 text-[10px] text-gray-400">
                Worst conditions in 7 days: 
                {site.weeklyWeather.some(d => d.severity === 'Critical') && <span className="text-red-400 ml-1">⚠️ Critical weather event</span>}
                {site.weeklyWeather.some(d => d.precipitation > 20) && <span className="text-blue-400 ml-1">🌧️ Heavy precipitation up to {Math.max(...site.weeklyWeather.map(d => d.precipitation)).toFixed(0)} mm</span>}
                {site.weeklyWeather.some(d => d.windSpeed > 50) && <span className="text-cyan-400 ml-1">💨 Strong winds up to {Math.max(...site.weeklyWeather.map(d => d.windSpeed)).toFixed(0)} km/h</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="bg-[#0f1325] px-6 py-3 border-t border-gray-800">
        <div className="flex justify-between items-center text-xs text-gray-500 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span>🌐 Weather data powered by Open-Meteo API</span>
            <span>📊 7-day detailed forecast with precipitation (mm/cm) & wind speed (km/h)</span>
            <span>🔄 Updates every hour</span>
          </div>
          <div>
            <span className="text-red-400">⚠️ Critical sites require immediate fuel dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherAlertDashboard;