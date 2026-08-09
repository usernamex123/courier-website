import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'sonner';
import Layout from "./layout/layout";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import GroundFreight from "./components/GroundFreight";
import GetStarted from "./components/GetStarted";
import DriverTracker from "./components/DriverTracker"; 
import LegalNotice from "./components/LegalNotice";
import UserLayout from "./layout/user";

// Import AdminSecure guard and dashboard container components
import AdminSecure from "./components/AdminSecure";
import { GuestOnlyRoute, AdminDashboardContainer } from "./components/AdminRoute";

// Import interactive AdminLogin form component
import AdminLogin from "./layout/AdminLogin";

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
        {/* Redirect base /admin to /admin/dashboard */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* STANDALONE LOGIN ROUTE: Protected by GuestOnlyRoute so authenticated admins are redirected */}
        <Route 
          path="/admin/login" 
          element={
            <GuestOnlyRoute>
              <AdminLogin />
            </GuestOnlyRoute>
          } 
        />
        
        {/* PROTECTED ADMIN ROUTE: Secured by AdminSecure to block direct URL access */}
        <Route element={<AdminSecure />}>
          <Route path="/admin/dashboard" element={<AdminDashboardContainer />} />
          <Route path="/admin/dashboard/*" element={<AdminDashboardContainer />} />
        </Route>
        
        {/* DRIVER PORTAL */}
        <Route path="/driver-portal" element={<DriverTracker />} />

        {/* USER LAYOUT ROUTES */}
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

        {/* PUBLIC SITE LAYOUT ROUTES */}
        <Route element={<Layout />}>
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