import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ScanRedirect() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function evaluateScanTarget() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        // If not logged in, route to home page with auto-track param
        if (!session) {
          navigate(`/?track=${trackingNumber}`, { replace: true });
          return;
        }

        // Check user role from your profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.role === 'driver') {
          // Route to your MyShipments page and signal it to open the update popup
          navigate(`/driver-portal/shipments?openUpdate=${trackingNumber}`, { replace: true });
        } else {
          // Client or other roles route to home page tracking input
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