import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import UserSidebar from "./UserSidebar";
import { Menu } from "lucide-react";

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Top Bar with Menu Toggle */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-black text-white border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-7 h-7 rounded-lg bg-yellow-400 text-black flex items-center justify-center text-xs font-black">JB</span>
            JB Logistics
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Route Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">
          <Outlet />
        </main>

      </div>
    </div>
  );
}