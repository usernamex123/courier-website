import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";

export default function ScanRedirect() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function evaluateScanTarget() {
      try {
        // 1. Check localStorage first for backend-authenticated drivers
        const cachedDriver = localStorage.getItem('driver_data');
        if (cachedDriver) {
          try {
            const driverObj = JSON.parse(cachedDriver);
            if (driverObj && driverObj.id) {
              navigate(`/driver-portal/shipments?openUpdate=${trackingNumber}`, { replace: true });
              return;
            }
          } catch (e) {
            localStorage.removeItem('driver_data');
          }
        }

        // 2. Check Supabase session for standard client or driver accounts
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate(`/?track=${trackingNumber}`, { replace: true });
          return;
        }

        // 3. Check driver_profiles table for Supabase-authenticated drivers
        const { data: profile } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          navigate(`/driver-portal/shipments?openUpdate=${trackingNumber}`, { replace: true });
        } else {
          navigate(`/?track=${trackingNumber}`, { replace: true });
        }
      } catch (err) {
        console.error("Error handling scan redirect:", err);
        navigate(`/?track=${trackingNumber}`, { replace: true });
      }
    }

    evaluateScanTarget();
  }, [trackingNumber, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-black font-sans">
      <div className="text-xl font-bold">Processing Scan...</div>
      <div className="text-sm text-gray-500 mt-1">Directing you securely...</div>
    </div>
  );
}