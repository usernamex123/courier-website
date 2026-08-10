import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Plus, FileText, Bell, User as UserIcon, ChevronLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/myshipments", label: "My Shipments", icon: Package },
  { to: "/dashboard/create", label: "Create Shipment", icon: Plus },
  { to: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/profile", label: "Profile", icon: UserIcon },
];

export default function UserSidebar({ open, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

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
            <button onClick={() => navigate("/admin")} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
              <ShieldCheck className="w-4 h-4" /> Admin Console
            </button>
          )}
          <NavLink to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white">
            <ChevronLeft className="w-4 h-4" /> Back to Site
          </NavLink>
        </div>
      </aside>
    </>
  );
}