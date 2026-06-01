// src/components/LiveWeatherRadar.jsx
import React from "react";
import { CloudRain, Clock } from "lucide-react";

const LiveWeatherRadar = () => {
  return (
    <div className="bg-gradient-to-br from-[#11172e] to-[#0c1124] rounded-2xl border border-gray-700/70 overflow-hidden shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="bg-[#0a0f20] px-5 py-3 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CloudRain size={20} className="text-blue-400" />
          <h2 className="font-semibold text-white">LIVE WEATHER RADAR</h2>
        </div>
        <div className="text-xs text-blue-300">Lahore & Surrounding Areas</div>
      </div>

      {/* Radar Container - Increased Height */}
      <div className="flex-1 relative bg-black/50 min-h-[380px] md:min-h-[420px]">
        <iframe
          src="https://embed.windy.com/embed2.html?lat=31.52&lon=74.36&zoom=7&level=surface&overlay=radar&menu=false&message=false&marker=false&calendar=false&pressure=false&type=map&location=coordinates&radarRange=150"
          className="w-full h-full"
          frameBorder="0"
          title="Live Weather Radar - Lahore"
          allowFullScreen
        />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 text-xs text-gray-400 flex justify-between items-center border-t border-gray-800 bg-[#0a0f20]">
        <span>
          <Clock size={12} className="inline mr-1.5" />
          Updated: Live
        </span>
        <span className="text-emerald-400">Intensity: Monitoring</span>
      </div>
    </div>
  );
};

export default LiveWeatherRadar;