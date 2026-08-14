import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Plus, FileText, Bell, User as UserIcon, ChevronLeft, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "./AuthContext";
import { supabase } from "../../supabase";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/myshipments", label: "My Shipments", icon: Package },
  { to: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/profile", label: "Profile", icon: UserIcon },
];

export default function UserSidebar({ open, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }
    setShowLogoutModal(false);
    navigate("/");
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-64 bg-black text-white/70 flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-16 flex items-center gap-2 px-5 border-b border-white/10 text-white font-bold shrink-0">
          <span className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center text-black text-sm font-black">JB</span>
          JB Logistics
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-yellow-400 text-black" : "hover:bg-white/10 hover:text-white"}`
              }
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1 shrink-0">
          {isAdmin && (
            <button onClick={() => navigate("/admin")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer">
              <ShieldCheck className="w-4 h-4" /> Admin Console
            </button>
          )}
          <div className="flex items-center justify-between px-1 pt-1">
            <NavLink to="/" className="flex items-center gap-2 py-2 text-sm text-white/60 hover:text-white">
              <ChevronLeft className="w-4 h-4" /> Back to Site
            </NavLink>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141210] border border-white/10 p-6 rounded-2xl max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Are you sure you wanna log out?</h3>
              <p className="text-xs text-stone-400">You will need to sign in again to access your dashboard.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}