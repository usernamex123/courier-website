import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, Package, Truck, CheckCircle2, Loader2 } from "lucide-react";
import EmptyState from "../components/logistics/EmptyState";
import { supabase } from "../lib/supabaseClient";

const getNotificationConfig = (status, trackingNumber) => {
  switch (status?.toLowerCase()) {
    case 'created':
    case 'pending':
      return {
        title: "Shipment Created",
        message: `Your shipment '${trackingNumber}' has been successfully created.`,
        icon: Package,
        accent: "text-slate-600 bg-slate-100"
      };
    case 'confirmed':
      return {
        title: "Shipment Confirmed",
        message: `Your shipment '${trackingNumber}' has been confirmed by the facility.`,
        icon: Package,
        accent: "text-blue-600 bg-blue-50"
      };
    case 'pickup_scheduled':
      return {
        title: "Pickup Scheduled",
        message: `A pickup has been scheduled for your shipment '${trackingNumber}'.`,
        icon: Truck,
        accent: "text-yellow-600 bg-yellow-50"
      };
    case 'picked_up':
      return {
        title: "Shipment Picked Up",
        message: `Your shipment '${trackingNumber}' has been picked up.`,
        icon: Truck,
        accent: "text-amber-600 bg-amber-50"
      };
    case 'in_transit':
      return {
        title: "Shipment In Transit",
        message: `Your shipment '${trackingNumber}' is now in transit.`,
        icon: Truck,
        accent: "text-blue-600 bg-blue-50"
      };
    case 'out_for_delivery':
      return {
        title: "Out for Delivery",
        message: `Your shipment '${trackingNumber}' is out for delivery.`,
        icon: Truck,
        accent: "text-purple-600 bg-purple-50"
      };
    case 'at_destination_facility':
      return {
        title: "At Destination Facility",
        message: `Your shipment '${trackingNumber}' has arrived at the destination facility.`,
        icon: Package,
        accent: "text-indigo-600 bg-indigo-50"
      };
    case 'delivered':
      return {
        title: "Shipment Delivered",
        message: `Your shipment '${trackingNumber}' has been delivered.`,
        icon: CheckCircle2,
        accent: "text-green-600 bg-green-50"
      };
    case 'cancelled':
      return {
        title: "Shipment Cancelled",
        message: `Your shipment '${trackingNumber}' has been cancelled.`,
        icon: Package,
        accent: "text-red-600 bg-red-50"
      };
    default:
      return {
        title: "Shipment Update",
        message: `Your shipment '${trackingNumber}' status has been updated.`,
        icon: Package,
        accent: "text-slate-600 bg-slate-100"
      };
  }
};

// Formats date & time strictly in Cleveland, Ohio (America/New_York)
const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York'
  });
};

// Formats time strictly in Cleveland, Ohio (America/New_York)
const fmtTimeOnly = (dateStr) => {
  if (!dateStr) return null;
  const parsedDate = new Date(dateStr);
  if (isNaN(parsedDate.getTime())) return null;
  return parsedDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  });
};

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserNotifications = async () => {
    try {
      setLoading(true);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      let assignedCode = user.user_metadata?.customer_id;

      if (!assignedCode) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('customer_id')
          .eq('user_id', user.id)
          .single();

        if (!profileError && profileData) {
          assignedCode = profileData.customer_id;
        }
      }

      if (!assignedCode) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const safeCode = String(assignedCode).trim();

      // 1. Fetch user's shipments first
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select('*')
        .or(`customer_id.eq.${safeCode},user_id.eq.${safeCode},profile_id.eq.${safeCode}`);

      if (shipmentsError) throw shipmentsError;

      if (!shipmentsData || shipmentsData.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const shipmentIds = shipmentsData.map(s => s.id);
      const shipmentMap = new Map(shipmentsData.map(s => [s.id, s]));

      let generatedNotifications = [];

      // 2. Try fetching tracking events from tracking_events table
      const { data: eventsData, error: eventsError } = await supabase
        .from('tracking_events')
        .select('*')
        .in('shipment_id', shipmentIds)
        .order('event_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!eventsError && eventsData && eventsData.length > 0) {
        generatedNotifications = eventsData.map((ev) => {
          const shipment = shipmentMap.get(ev.shipment_id);
          const trackingNum = shipment?.tracking_number || "N/A";
          const status = ev.status || shipment?.current_status;
          const config = getNotificationConfig(status, trackingNum);
          
          // Check all possible admin-set time column names
          const adminSetTime = ev.event_time || ev.time || ev.custom_time || ev.event_date || shipment?.event_time;
          const timeString = fmtTimeOnly(adminSetTime);
          
          let baseText = ev.description || config.message;
          baseText = baseText.trim().replace(/[.]+$/, '');
          const finalMessage = timeString ? `${baseText} at ${timeString}.` : `${baseText}.`;

          return {
            id: `notif-event-${ev.id}`,
            shipmentId: ev.shipment_id,
            trackingNumber: trackingNum,
            title: config.title,
            message: finalMessage,
            icon: config.icon,
            accent: config.accent,
            // Right-side badge uses created_at (when row was submitted)
            created_date: ev.created_at || ev.event_time || new Date().toISOString()
          };
        });
      } else {
        // Fallback to shipments table if tracking_events is empty
        generatedNotifications = shipmentsData.map((s) => {
          const config = getNotificationConfig(s.current_status, s.tracking_number);
          const adminSetTime = s.event_time || s.time || s.custom_time || s.event_date;
          const timeString = fmtTimeOnly(adminSetTime);
          
          let baseText = config.message.trim().replace(/[.]+$/, '');
          const finalMessage = timeString ? `${baseText} at ${timeString}.` : `${baseText}.`;

          return {
            id: `notif-${s.id}-${s.current_status}`,
            shipmentId: s.id,
            trackingNumber: s.tracking_number,
            title: config.title,
            message: finalMessage,
            icon: config.icon,
            accent: config.accent,
            created_date: s.created_at || s.updated_at || s.event_time || new Date().toISOString()
          };
        });
      }

      generatedNotifications.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setNotifications(generatedNotifications);
    } catch (err) {
      console.error("Error fetching notifications:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserNotifications();

    const shipmentChannel = supabase
      .channel('public:customer-shipments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        fetchUserNotifications();
      })
      .subscribe();

    const eventsChannel = supabase
      .channel('public:customer-tracking-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracking_events' }, () => {
        fetchUserNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(shipmentChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
          <p className="text-xs text-slate-500">Real-time alerts regarding your shipment status updates.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Bell className="w-4 h-4 text-yellow-600" />
          <span className="text-xs font-bold text-slate-900">{notifications.length} Alerts</span>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState 
            icon={Bell} 
            title="You're all caught up" 
            description="No tracking notifications found for your account yet." 
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {notifications.map((n) => {
            const IconComponent = n.icon;
            return (
              <Link 
                key={n.id} 
                to={`/dashboard/myshipments?open=${n.shipmentId}`}
                className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${n.accent}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-yellow-600 transition-colors">
                      {n.title}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {fmtDate(n.created_date)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {n.message}
                  </p>
                  <div className="text-[11px] font-mono font-semibold text-slate-400 mt-1.5">
                    Tracking #: {n.trackingNumber}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}