// src/components/TopBar.jsx
import React from "react";
import { Menu, Bell } from "lucide-react";

const TopBar = ({ onMenuClick }) => {
  return (
    <div className="bg-[#13182b]/90 backdrop-blur-sm border-b border-gray-800 px-5 py-3 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden bg-[#1a2142] p-2 rounded-xl text-white"
        >
          <Menu size={22} />
        </button>
      </div>
      <Bell size={20} className="text-gray-400" />
    </div>
  );
};

export default TopBar;