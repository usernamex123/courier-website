import React from 'react';
import { Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import Layout from "./layout/layout";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import GroundFreight from "./components/GroundFreight";
import GetStarted from "./components/GetStarted";
import DriverTracker from "./components/DriverTracker"; 
import LegalNotice from "./components/LegalNotice";
import UserLayout from "./layout/user";

// Import everything neatly from your existing file
import AdminRoute, { GuestOnlyRoute, AdminLogin, AdminDashboardContainer } from "./components/AdminRoute";

export default function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      
      <style>{`
        .tech-grid {
          background-image: 
            radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 24px 24px, 48px 48px, 48px 48px;
          background-position: 0 0, 0 0, 0 0;
        }
      `}</style>

      <Routes>
        {/* STANDALONE LOGIN ROUTE */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Protects dashboard sub-routes using a clean wildcard catch */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard/*" element={<AdminDashboardContainer />} />
        </Route>
        
        <Route path="/driver-portal" element={<DriverTracker />} />

        <Route element={<UserLayout />}>
          <Route path="/profile" element={
            <div className="max-w-4xl mx-auto px-5 py-12 text-white">
              <div className="border border-white/15 bg-[#0e0c0b]/90 backdrop-blur-md p-8 shadow-2xl">
                <h1 className="text-3xl font-black uppercase tracking-wider text-yellow-500 mb-4">User Profile</h1>
                <p className="text-stone-300">View and update your personal user profile details here.</p>
              </div>
            </div>
          } />
          <Route path="/settings" element={
            <div className="max-w-4xl mx-auto px-5 py-12 text-white">
              <div className="border border-white/15 bg-[#0e0c0b]/90 backdrop-blur-md p-8 shadow-2xl">
                <h1 className="text-3xl font-black uppercase tracking-wider text-yellow-500 mb-4">Account Settings</h1>
                <p className="text-stone-300">Configure your account security and preferences here.</p>
              </div>
            </div>
          } />
        </Route>

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="auth" element={<Auth />} />
          <Route path="ground-freight" element={<GroundFreight />} />
          <Route path="get-started" element={<GetStarted />} />
          <Route path="privacy-policy" element={<LegalNotice />} />
        </Route>
      </Routes>
    </>
  );
}