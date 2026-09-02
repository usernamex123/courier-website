import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
  return `${protocol}//${hostname}:5000`;
};

const API_URL = getApiUrl();

export default function DriverCookiee() {
  const navigate = useNavigate();

  const [isAuthorized, setIsAuthorized] = useState(() => {
    try {
      // Check every possible storage variation
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('driver') || key.includes('user') || key.includes('session'))) {
          return true;
        }
      }
      return !!(
        localStorage.getItem('driver_data') || 
        localStorage.getItem('driver_session') || 
        localStorage.getItem('driver') ||
        localStorage.getItem('user') ||
        localStorage.getItem('driverId')
      );
    } catch (e) {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState(!isAuthorized);

  useEffect(() => {
    let isMounted = true;

    const verifyDriverAuth = async () => {
      try {
        let hasLocalData = false;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('driver') || key.includes('user') || key.includes('session'))) {
            hasLocalData = true;
            break;
          }
        }

        if (!hasLocalData) {
          hasLocalData = !!(
            localStorage.getItem('driver_data') || 
            localStorage.getItem('driver_session') || 
            localStorage.getItem('driver') ||
            localStorage.getItem('user') ||
            localStorage.getItem('driverId')
          );
        }

        // If local data exists, authorize immediately without waiting on network calls that might fail
        if (hasLocalData) {
          if (isMounted) {
            setIsAuthorized(true);
            setIsLoading(false);
          }
          return;
        }

        // Fallback: check backend cookie if no local storage found
        const res = await fetch(`${API_URL}/api/driver/profile`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.driver || data.user)) {
            localStorage.setItem('driver_data', JSON.stringify(data.driver || data.user));
            hasLocalData = true;
          }
        }

        if (!isMounted) return;

        if (!hasLocalData) {
          toast.error('Unauthorized access. Please log in as a driver.');
          navigate('/', { replace: true });
        } else {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        // If local storage exists despite network error, keep user authorized
        const hasFallback = localStorage.length > 0;
        if (isMounted) {
          if (hasFallback) {
            setIsAuthorized(true);
          } else {
            toast.error('Unauthorized access. Please log in as a driver.');
            navigate('/', { replace: true });
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (!isAuthorized) {
      verifyDriverAuth();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [navigate, isAuthorized]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return <Outlet />;
}