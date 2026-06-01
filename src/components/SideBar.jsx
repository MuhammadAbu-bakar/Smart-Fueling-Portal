// src/components/Sidebar.jsx
import React from "react";
import { TowerControl, Circle, LayoutDashboard, Map, Fuel } from "lucide-react";

const Sidebar = ({ navItems, sidebarOpen }) => {
  return (
    <aside
      className={`fixed md:relative z-30 w-72 bg-[#13182b] border-r border-gray-800 p-5 flex flex-col transition-transform duration-300 h-full ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-500 p-2 rounded-xl shadow-lg">
          <TowerControl size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight">FUEL PORTAL</h1>
          <p className="text-gray-400 text-xs">Network Operations</p>
        </div>
      </div>
      <div className="mb-6">
        <nav className="space-y-2">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                item.active ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:bg-[#1a213a]"
              }`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-auto pt-6 border-t border-gray-800">
        <div className="bg-[#0f1325] rounded-xl p-3 text-center">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">System Status</span>
            <span className="text-green-400 text-xs flex items-center gap-1">
              <Circle size={8} fill="#4ade80" stroke="none" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;