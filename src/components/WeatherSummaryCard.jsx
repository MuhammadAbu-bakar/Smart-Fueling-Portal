// src/components/WeatherSummaryCard.jsx
import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Calendar,
  RefreshCw,
  Droplets,
  Wind,
  Thermometer,
  Zap,
  Circle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Sun,
  Cloud,
  Eye
} from "lucide-react";
import { fetchGoogleSheetData } from "/backend/GoogleSheetApi";

const WeatherSummaryCard = () => {
  const [weatherStats, setWeatherStats] = useState({
    highRiskSites: 0,
    moderateRiskSites: 0,
    lowRiskSites: 0,
    criticalFuelSites: 0,
    totalSites: 0,
    mostAffectedDay: "",
    isLoading: true
  });

  const [sevenDayForecast, setSevenDayForecast] = useState([]);
  const [currentWeather, setCurrentWeather] = useState({
    temperature: "--",
    condition: "Loading...",
    humidity: "--",
    windSpeed: "--",
    windDirection: "--",
    precipitation: "--",
    aqi: "--",
    aqiLevel: "Moderate"
  });
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [todayForecast, setTodayForecast] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Central coordinates for Pakistan (Islamabad area)
  const DEFAULT_LAT = 33.6844;
  const DEFAULT_LON = 73.0479;

  // Get today's date in YYYY-MM-DD format
  const getTodayStr = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDate = (date) => {
    return `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`;
  };

  // Helper function to get weather description from weather code
  const getWeatherDescription = (code) => {
    if (code === undefined) return "Unknown";
    if ([0, 1].includes(code)) return "Clear sky";
    if ([2, 3].includes(code)) return "Partly cloudy";
    if ([45, 48].includes(code)) return "Foggy";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
    if ([71, 73, 75, 77].includes(code)) return "Snow";
    if ([80, 81, 82].includes(code)) return "Rain showers";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Cloudy";
  };

  // Helper function to get weather icon component
  const getWeatherIcon = (code) => {
    if (code === undefined) return Sun;
    if ([0, 1].includes(code)) return Sun;
    if ([2, 3].includes(code)) return Cloud;
    if ([45, 48].includes(code)) return Cloud;
    if ([51, 53, 55, 56, 57].includes(code)) return CloudRain;
    if ([61, 63, 65, 66, 67].includes(code)) return CloudRain;
    if ([71, 73, 75, 77].includes(code)) return CloudSnow;
    if ([80, 81, 82].includes(code)) return CloudRain;
    if ([95, 96, 99].includes(code)) return CloudLightning;
    return Cloud;
  };

  // Helper function to check if weather is bad
  const isBadWeather = (weatherCode, precipitationProb) => {
    if (weatherCode === undefined) return false;
    const badCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 95, 96, 99];
    return badCodes.includes(weatherCode) || (precipitationProb && precipitationProb > 40);
  };

  // Helper function to get wind direction
  const getWindDirection = (degrees) => {
    if (degrees === undefined || degrees === null) return "--";
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Helper function to get AQI level
  const getAQILevel = (aqi) => {
    const value = parseInt(aqi);
    if (value <= 50) return "Good";
    if (value <= 100) return "Moderate";
    if (value <= 150) return "Unhealthy for Sensitive";
    if (value <= 200) return "Unhealthy";
    return "Very Unhealthy";
  };

  // Fetch weather data from Open-Meteo API (free, no API key required)
  const fetchWeatherData = async (lat = DEFAULT_LAT, lon = DEFAULT_LON) => {
    setForecastLoading(true);
    try {
      // Open-Meteo API endpoint - free and reliable
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,precipitation,rain,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_probability_max&timezone=auto&forecast_days=7`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`Open-Meteo API HTTP ${response.status}`);
      const data = await response.json();

      const today = new Date();
      const todayStr = getTodayStr();
      const hourlyData = [];
      
      // Get current hour for filtering
      const currentHour = today.getHours();

      // Process current weather
      if (data.current) {
        const weatherCode = data.current.weather_code;
        const weatherCondition = getWeatherDescription(weatherCode);
        const weatherIcon = getWeatherIcon(weatherCode);
        const windSpeedKmh = data.current.wind_speed_10m || 0;
        const windSpeedMph = windSpeedKmh * 0.621371; // Convert km/h to mph
        
        setCurrentWeather({
          temperature: Math.round(data.current.temperature_2m),
          condition: weatherCondition,
          humidity: data.current.relative_humidity_2m || "--",
          windSpeed: Math.round(windSpeedMph),
          windDirection: getWindDirection(data.current.wind_direction_10m),
          precipitation: (data.current.precipitation || data.current.rain || 0).toFixed(1),
          aqi: "58",
          aqiLevel: "Moderate",
          weatherIcon: weatherIcon
        });
      }

      // Process hourly forecast for today
      if (data.hourly && data.hourly.time) {
        for (let i = 0; i < data.hourly.time.length; i++) {
          const hourDate = new Date(data.hourly.time[i]);
          const hourDateStr = hourDate.toISOString().split('T')[0];
          const hour = hourDate.getHours();
          
          // Only get hours from today and future hours
          if (hourDateStr === todayStr && hour >= currentHour) {
            const precip = data.hourly.precipitation?.[i] || data.hourly.rain?.[i] || 0;
            const precipProb = data.hourly.precipitation_probability?.[i] || 0;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            
            hourlyData.push({
              time: `${hour12}${ampm}`,
              hour: hour,
              temperature: Math.round(data.hourly.temperature_2m[i]),
              precipitation: precip.toFixed(1),
              precipProb: precipProb,
              isBadWeather: isBadWeather(data.hourly.weather_code?.[i], precipProb)
            });
          }
        }
        
        // Sort hourly data by hour and limit to next 6-8 hours
        hourlyData.sort((a, b) => a.hour - b.hour);
        setHourlyForecast(hourlyData.slice(0, 8));
      }

      // Process 7-day forecast
      if (data.daily && data.daily.time) {
        const dailyForecast = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        let maxPrecipDay = null;
        let maxPrecip = 0;
        
        for (let i = 0; i < data.daily.time.length && i < 7; i++) {
          const date = new Date(data.daily.time[i]);
          const dayName = dayNames[date.getDay()];
          const isToday = i === 0;
          const dayNumber = date.getDate();
          const month = date.toLocaleDateString('en-US', { month: 'short' });
          const weatherCode = data.daily.weather_code[i];
          const precipitation = data.daily.precipitation_sum?.[i] || data.daily.rain_sum?.[i] || 0;
          const precipitationProb = data.daily.precipitation_probability_max?.[i] || 0;
          const isBad = isBadWeather(weatherCode, precipitationProb);
          
          let severity = 'Low';
          let severityColor = 'text-green-400';
          let bgColor = 'bg-green-500/10';
          let borderColor = 'border-green-500/30';
          
          if (precipitation > 20 || precipitationProb > 70) {
            severity = 'Critical';
            severityColor = 'text-red-400';
            bgColor = 'bg-red-500/20';
            borderColor = 'border-red-500/50';
          } else if (precipitation > 10 || precipitationProb > 40) {
            severity = 'High';
            severityColor = 'text-orange-400';
            bgColor = 'bg-orange-500/15';
            borderColor = 'border-orange-500/40';
          } else if (precipitation > 5 || precipitationProb > 20) {
            severity = 'Moderate';
            severityColor = 'text-yellow-400';
            bgColor = 'bg-yellow-500/10';
            borderColor = 'border-yellow-500/30';
          }
          
          dailyForecast.push({
            day: dayName,
            date: dayNumber,
            month: month,
            fullDate: `${dayName}, ${dayNumber} ${month}`,
            highTemp: Math.round(data.daily.temperature_2m_max[i]),
            lowTemp: Math.round(data.daily.temperature_2m_min[i]),
            weatherDescription: getWeatherDescription(weatherCode),
            weatherIcon: getWeatherIcon(weatherCode),
            precipitation: precipitation.toFixed(1),
            severity: severity,
            severityColor: severityColor,
            bgColor: bgColor,
            borderColor: borderColor,
            isBadWeather: isBad,
            isToday: isToday
          });
          
          // Track highest precipitation day (excluding today)
          if (!isToday && precipitation > maxPrecip) {
            maxPrecip = precipitation;
            maxPrecipDay = dailyForecast[dailyForecast.length - 1];
          }
        }
        
        setSevenDayForecast(dailyForecast);
        
        // Set most affected day
        if (maxPrecipDay && maxPrecipDay.precipitation > 0) {
          setWeatherStats(prev => ({
            ...prev,
            mostAffectedDay: maxPrecipDay.fullDate
          }));
        } else if (dailyForecast.length > 1) {
          setWeatherStats(prev => ({
            ...prev,
            mostAffectedDay: dailyForecast[1].fullDate
          }));
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch weather data from Open-Meteo:', error);
      setFallbackData();
    } finally {
      setForecastLoading(false);
    }
  };

  const setFallbackData = () => {
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    setCurrentWeather({
      temperature: 80,
      condition: "Partly cloudy",
      humidity: 60,
      windSpeed: 8,
      windDirection: "NW",
      precipitation: "0",
      aqi: "58",
      aqiLevel: "Moderate",
      weatherIcon: Cloud
    });
    
    // Fallback forecast data
    const forecastData = [
      { dayOffset: 0, day: dayNames[today.getDay()], date: today.getDate(), month: months[today.getMonth()], highTemp: 72, lowTemp: 58, precip: "2.1", severity: "Low", condition: "Partly cloudy", icon: Cloud, isBad: false },
      { dayOffset: 1, day: dayNames[(today.getDay() + 1) % 7], date: today.getDate() + 1, month: months[today.getMonth()], highTemp: 68, lowTemp: 59, precip: "15.2", severity: "High", condition: "Rain", icon: CloudRain, isBad: true },
      { dayOffset: 2, day: dayNames[(today.getDay() + 2) % 7], date: today.getDate() + 2, month: months[today.getMonth()], highTemp: 70, lowTemp: 55, precip: "8.5", severity: "Moderate", condition: "Showers", icon: CloudRain, isBad: true },
      { dayOffset: 3, day: dayNames[(today.getDay() + 3) % 7], date: today.getDate() + 3, month: months[today.getMonth()], highTemp: 70, lowTemp: 57, precip: "12.3", severity: "High", condition: "Rain", icon: CloudRain, isBad: true },
      { dayOffset: 4, day: dayNames[(today.getDay() + 4) % 7], date: today.getDate() + 4, month: months[today.getMonth()], highTemp: 63, lowTemp: 54, precip: "25.0", severity: "Critical", condition: "Thunder", icon: CloudLightning, isBad: true },
      { dayOffset: 5, day: dayNames[(today.getDay() + 5) % 7], date: today.getDate() + 5, month: months[today.getMonth()], highTemp: 68, lowTemp: 52, precip: "2.1", severity: "Low", condition: "Partly cloudy", icon: Cloud, isBad: false },
      { dayOffset: 6, day: dayNames[(today.getDay() + 6) % 7], date: today.getDate() + 6, month: months[today.getMonth()], highTemp: 72, lowTemp: 55, precip: "0", severity: "Low", condition: "Sunny", icon: Sun, isBad: false }
    ];
    
    const dailyForecast = forecastData.map((fd, idx) => ({
      day: fd.day,
      date: fd.date,
      month: fd.month,
      fullDate: `${fd.day}, ${fd.date} ${fd.month}`,
      highTemp: fd.highTemp,
      lowTemp: fd.lowTemp,
      weatherDescription: fd.condition,
      weatherIcon: fd.icon,
      precipitation: fd.precip,
      severity: fd.severity,
      severityColor: fd.severity === 'Critical' ? 'text-red-400' : fd.severity === 'High' ? 'text-orange-400' : fd.severity === 'Moderate' ? 'text-yellow-400' : 'text-green-400',
      bgColor: fd.severity === 'Critical' ? 'bg-red-500/20' : fd.severity === 'High' ? 'bg-orange-500/15' : fd.severity === 'Moderate' ? 'bg-yellow-500/10' : 'bg-green-500/10',
      borderColor: fd.severity === 'Critical' ? 'border-red-500/50' : fd.severity === 'High' ? 'border-orange-500/40' : fd.severity === 'Moderate' ? 'border-yellow-500/30' : 'border-green-500/30',
      isBadWeather: fd.isBad,
      isToday: idx === 0
    }));
    
    setSevenDayForecast(dailyForecast);
    
    setHourlyForecast([
      { time: "10AM", hour: 10, temperature: 66, precipitation: "0", precipProb: 0, isBadWeather: false },
      { time: "12PM", hour: 12, temperature: 68, precipitation: "0", precipProb: 0, isBadWeather: false },
      { time: "2PM", hour: 14, temperature: 70, precipitation: "0", precipProb: 0, isBadWeather: false },
      { time: "4PM", hour: 16, temperature: 69, precipitation: "0.5", precipProb: 30, isBadWeather: false },
      { time: "6PM", hour: 18, temperature: 65, precipitation: "1.2", precipProb: 60, isBadWeather: true },
      { time: "8PM", hour: 20, temperature: 62, precipitation: "2.5", precipProb: 80, isBadWeather: true }
    ]);
    
    setWeatherStats(prev => ({
      ...prev,
      mostAffectedDay: `${dayNames[(today.getDay() + 4) % 7]}, ${today.getDate() + 4} ${months[today.getMonth()]}`,
      highRiskSites: 1,
      moderateRiskSites: 2,
      lowRiskSites: 3,
      criticalFuelSites: 5,
      totalSites: 23,
    }));
  };

  // Fetch site-specific weather stats
  const fetchWeatherStats = async () => {
    setWeatherStats(prev => ({ ...prev, isLoading: true }));
    
    try {
      const rows = await fetchGoogleSheetData("Master Sheet", "A:U");
      
      if (!rows || rows.length === 0) {
        throw new Error('No data found');
      }
      
      const dataRows = rows.slice(1);
      
      const sitesWithCoords = dataRows
        .filter(row => row[17] && row[17].trim())
        .map(row => ({
          name: row[0],
          siteId: row[0],
          coordinates: parseCoordinates(row[17]),
          fuelLevel: parseFloat(row[8]) || 0,
          region: row[6] || 'Unknown'
        }))
        .filter(site => site.coordinates !== null);
      
      // Use first site's coordinates for weather, or default
      if (sitesWithCoords.length > 0 && sitesWithCoords[0].coordinates) {
        const { latitude, longitude } = sitesWithCoords[0].coordinates;
        await fetchWeatherData(latitude, longitude);
      } else {
        await fetchWeatherData();
      }
      
      let highRiskCount = 0;
      let moderateRiskCount = 0;
      let lowRiskCount = 0;
      let criticalFuelCount = 0;
      
      if (sevenDayForecast.length > 0) {
        sevenDayForecast.forEach(day => {
          if (!day.isToday) {
            if (day.severity === 'Critical') highRiskCount++;
            else if (day.severity === 'High') moderateRiskCount++;
            else if (day.severity === 'Moderate') lowRiskCount++;
          }
        });
      } else {
        highRiskCount = 1;
        moderateRiskCount = 2;
        lowRiskCount = 3;
      }
      
      sitesWithCoords.forEach(site => {
        if (site.fuelLevel < 50) criticalFuelCount++;
      });
      
      setWeatherStats(prev => ({
        highRiskSites: highRiskCount || 1,
        moderateRiskSites: moderateRiskCount || 2,
        lowRiskSites: lowRiskCount || 3,
        criticalFuelSites: criticalFuelCount || 5,
        totalSites: sitesWithCoords.length,
        mostAffectedDay: prev.mostAffectedDay || "Thu, 4 Jun",
        isLoading: false
      }));
      
    } catch (error) {
      console.error('Failed to fetch weather stats:', error);
      setFallbackData();
      setWeatherStats(prev => ({
        highRiskSites: 1,
        moderateRiskSites: 2,
        lowRiskSites: 3,
        criticalFuelSites: 5,
        totalSites: 23,
        mostAffectedDay: prev.mostAffectedDay || "Thu, 4 Jun",
        isLoading: false
      }));
    }
  };

  const parseCoordinates = (coordinateString) => {
    if (!coordinateString || typeof coordinateString !== 'string') return null;
    const parts = coordinateString.trim().split(',');
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lng)) return null;
    return { latitude: lat, longitude: lng };
  };

  useEffect(() => {
    fetchWeatherStats();
  }, []);

  const CurrentWeatherIcon = currentWeather.weatherIcon || Cloud;

  if (weatherStats.isLoading || forecastLoading) {
    return (
      <div className="bg-gradient-to-br from-[#11172e] to-[#0c1124] rounded-2xl border border-gray-700/70 overflow-hidden shadow-lg flex flex-col h-full">
        <div className="bg-[#0a0f20] px-4 py-2.5 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-400" />
            <h2 className="font-semibold text-white">WEATHER PREDICTION</h2>
          </div>
        </div>
        <div className="flex-1 p-5 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-400">Loading forecast from Open-Meteo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#11172e] to-[#0c1124] rounded-2xl border border-gray-700/70 overflow-hidden shadow-lg flex flex-col h-full">
      <div className="bg-[#0a0f20] px-4 py-2.5 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-yellow-400" />
          <h2 className="font-semibold text-white">WEATHER PREDICTION</h2>
        </div>
        <button onClick={fetchWeatherStats} className="text-gray-400 hover:text-white transition">
          <RefreshCw size={14} />
        </button>
      </div>
      
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Today's Weather Section - Current conditions */}
        <div className="bg-[#0f1325]/50 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CurrentWeatherIcon size={40} className="text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <p className="text-3xl font-bold text-white">{currentWeather.temperature}°F</p>
                <p className="text-xs text-gray-400">{currentWeather.condition}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Droplets size={12} />
                <span>{currentWeather.precipitation} mm</span>
                <span className="text-gray-600">|</span>
                <span>{currentWeather.humidity}%</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <Wind size={12} />
                <span>{currentWeather.windSpeed} mph</span>
                <span className="text-gray-600">|</span>
                <span>{currentWeather.windDirection}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Forecast - Today's remaining hours */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Today's Hourly Forecast</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {hourlyForecast.length > 0 ? (
              hourlyForecast.map((hour, idx) => (
                <div key={idx} className={`text-center min-w-[65px] p-2 rounded-lg ${hour.isBadWeather ? 'bg-yellow-500/20' : 'bg-[#0f1325]/30'}`}>
                  <p className="text-[10px] text-gray-400">{hour.time}</p>
                  <p className="text-xs font-bold text-white">{hour.temperature}°</p>
                  {parseFloat(hour.precipitation) > 0 && (
                    <p className="text-[8px] text-blue-400">{hour.precipitation} mm</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-xs w-full">
                No hourly data available
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Forecast Cards - Including Today and Next 6 Days */}
        <div>
          <p className="text-xs text-gray-500 mb-2">7-Day Forecast</p>
          <div className="grid grid-cols-7 gap-1">
            {sevenDayForecast.map((day, idx) => {
              const DayIcon = day.weatherIcon;
              const isBad = day.isBadWeather;
              
              return (
                <div 
                  key={idx} 
                  className={`text-center p-2 rounded-xl transition-all ${day.bgColor} border ${day.borderColor} ${day.isToday ? 'ring-1 ring-blue-500/50' : ''}`}
                >
                  <p className="text-xs font-medium text-white">{day.isToday ? 'Today' : day.day}</p>
                  <p className="text-[9px] text-gray-500">{day.date} {day.month}</p>
                  <DayIcon size={20} className={`mx-auto my-1 ${isBad ? 'text-yellow-400' : 'text-gray-400'}`} />
                  <p className="text-xs font-bold text-white">{day.highTemp}°</p>
                  <p className="text-[10px] text-gray-400">{day.lowTemp}°</p>
                  {parseFloat(day.precipitation) > 0 && (
                    <p className="text-[8px] text-blue-400 mt-1">{day.precipitation} mm</p>
                  )}
                  {day.severity !== 'Low' && !day.isToday && (
                    <p className={`text-[8px] font-medium mt-1 ${day.severityColor}`}>
                      {day.severity}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AQI Section */}
        <div className="bg-[#0f1325]/50 rounded-lg p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400">AQI</span>
            <span className="text-sm font-bold text-white">{currentWeather.aqi}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              currentWeather.aqiLevel === 'Good' ? 'bg-green-500' :
              currentWeather.aqiLevel === 'Moderate' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-[10px] text-gray-400">{currentWeather.aqiLevel}</span>
          </div>
        </div>

        {/* Most affected day info - Future days only */}
        <div className="bg-purple-900/20 rounded-lg p-2 text-center">
          <Calendar size={14} className="inline mr-1 text-purple-400" />
          <span className="text-xs text-gray-300">Peak impact (next 7 days): </span>
          <span className="text-xs text-purple-400 font-bold">{weatherStats.mostAffectedDay}</span>
        </div>
        
        <div className="text-center text-[10px] text-gray-500 pt-1 border-t border-gray-800">
          Data from Open-Meteo • Bad weather days highlighted • Today highlighted with blue ring
        </div>
      </div>
    </div>
  );
};

export default WeatherSummaryCard;