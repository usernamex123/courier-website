import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export function useShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);

      // Get the currently authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      let query = supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      // Strictly filter by the logged-in user's ID
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        setShipments([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;
      if (error) throw error;

      setShipments(data || []);
    } catch (err) {
      console.error("Error fetching shipments:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return { shipments, loading, refetch: fetchShipments };
}