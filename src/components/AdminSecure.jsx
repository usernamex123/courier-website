import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
  return `${protocol}//${hostname}:5000`;
};

const API_URL = getApiUrl();

export default function AdminSecure() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      // 200ms delay to give the browser time to finish registering the cookie after redirect
      await new Promise((resolve) => setTimeout(resolve, 200));

      try {
        const res = await fetch(`${API_URL}/api/admin/session`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include' // Crucial: sends session cookie back to backend
        });
        const data = await res.json();

        if (res.ok && data.authenticated) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  // Redirect to homepage if user typed /admin/dashboard directly without an active session
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}