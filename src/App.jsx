import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'sonner';
import Layout from "./layout/layout";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import GetStarted from "./components/GetStarted";
import DriverDashboard from "./components/DriverDashboard"; 
import LegalNotice from "./components/LegalNotice";
import DashboardLayout from "./layout/DashboardLayout";
import UserDashboard from "./layout/UserDashboard";
import DriverMyShipments from "./components/DriverMyShipments";
import DriverProfile from './components/DriverProfile';
import ScanRedirect from "./pages/ScanRedirect";
import DriverCookiee from './components/DriverCookiee';

// Import dashboard feature components
import MyShipments from "./layout/MyShipments";
import CustomerNotifications from "./layout/CustomerNotifications";
import CustomerProfile from "./layout/CustomerProfile";
import CustomerInvoice from "./layout/CustomerInvoice";
import CustomerPayments from "./layout/CustomerPayments";
import DriverScanShipments from './components/DriverScanShipments';
import DriverCompleted from './components/DriverCompleted';

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
          <Route path="/admin/dashboard/*" element={<AdminDashboardContainer />} />
        </Route>
        
        {/* GLOBAL REDIRECTS & UTILS */}
        <Route path="/scan/:trackingNumber" element={<ScanRedirect />} />

        {/* DRIVER PORTAL: Protected centrally by DriverCookiee layout wrapper */}
        <Route path="/driver-portal" element={<DriverCookiee />}>
          <Route index element={<DriverDashboard />} />
          <Route path="shipments" element={<DriverMyShipments />} />
          <Route path="scan" element={<DriverScanShipments />} />
          <Route path="profile" element={<DriverProfile />} />
          <Route path="completed" element={<DriverCompleted />} />
        </Route>

        {/* LEGACY PORTAL REDIRECTS */}
        <Route path="/portal" element={<Navigate to="/dashboard" replace />} />
        <Route path="/portal/*" element={<Navigate to="/dashboard" replace />} />

        {/* USER DASHBOARD ROUTES: Protected by DashboardLayout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="myshipments" element={<MyShipments />} />
          <Route path="myshipments/:id" element={
            <div className="max-w-6xl mx-auto px-5 py-8 text-white">
              <div className="border border-white/15 bg-[#0e0c0b]/90 backdrop-blur-md p-8 shadow-2xl">
                <h1 className="text-3xl font-black uppercase tracking-wider text-yellow-500 mb-4">Shipment Details</h1>
                <p className="text-stone-300">Detailed tracking timeline and package information.</p>
              </div>
            </div>
          } />
          <Route path="create" element={
            <div className="max-w-6xl mx-auto px-5 py-8 text-white">
              <div className="border border-white/15 bg-[#0e0c0b]/90 backdrop-blur-md p-8 shadow-2xl">
                <h1 className="text-3xl font-black uppercase tracking-wider text-yellow-500 mb-4">Create Shipment</h1>
                <p className="text-stone-300">Fill out the form to dispatch a new package.</p>
              </div>
            </div>
          } />
          <Route path="invoices" element={<CustomerInvoice />} />
          <Route path="payments" element={<CustomerPayments />} />
          <Route path="notifications" element={<CustomerNotifications />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="settings" element={
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
          <Route path="get-started" element={<GetStarted />} />
          <Route path="privacy-policy" element={<LegalNotice />} />
        </Route>
      </Routes>
    </>
  );
}