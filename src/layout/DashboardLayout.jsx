import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Loader2, Menu } from "lucide-react";
import UserSidebar from "./UserSidebar";
import { supabase } from "../lib/supabaseClient";

export default function DashboardLayout() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          navigate("/", { replace: true });
          return;
        }
        setLoading(false);
      } catch (err) {
        console.error("Auth check error:", err);
        navigate("/", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar with 3-Line Menu Button */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 font-bold text-slate-900">
            <span className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center text-black text-xs font-black">JB</span>
            <span className="text-sm tracking-tight">JB Logistics Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Open Sidebar"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}