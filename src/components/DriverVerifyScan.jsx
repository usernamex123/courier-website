import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import DriverHeader from './DriverHeader';
import DriverSidebar from './DriverSidebar';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Scan, 
  Package, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ShieldCheck,
  LayoutDashboard,
  Bell,
  User,
  Truck
} from 'lucide-react';

export default function DriverVerifyScan() {
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Batch verification states
  const [verifyQueue, setVerifyQueue] = useState([]); // Fixed array of IDs
  const [verifiedSet, setVerifiedSet] = useState(new Set()); // Successfully scanned IDs
  const [queueShipmentsData, setQueueShipmentsData] = useState([]);

  const inputRef = useRef(null);

  // Load the queue from localStorage on mount
  useEffect(() => {
    try {
      const rawQueue = localStorage.getItem('verify_queue');
      if (rawQueue) {
        const parsedIDs = JSON.parse(rawQueue);
        setVerifyQueue(parsedIDs);
        fetchQueueDetails(parsedIDs);
      } else {
        toast.error('No verification queue found. Please select shipments first.');
        navigate('/driver-portal/shipments');
      }
    } catch (e) {
      console.error('Failed to load verify queue:', e);
    }
  }, [navigate]);

  const fetchQueueDetails = async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .in('id', ids);

      if (error) throw error;
      setQueueShipmentsData(data || []);
    } catch (err) {
      console.error('Error fetching queue shipment details:', err);
      toast.error('Failed to load verification queue details');
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    const code = inputCode.trim();
    if (!code) return;

    setLoading(true);
    try {
      // Find matching shipment by tracking number or UUID
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('*')
        .or(`tracking_number.eq.${code},id.eq.${code}`);

      if (error) throw error;

      if (!shipments || shipments.length === 0) {
        toast.error(`Shipment not found: ${code}`);
        setInputCode('');
        setLoading(false);
        return;
      }

      const scannedShipment = shipments[0];

      // 1. Check if scanned item belongs to the active queue
      if (!verifyQueue.includes(scannedShipment.id)) {
        toast.error(`Wrong shipment! ${scannedShipment.tracking_number} is not in your selected batch.`);
        setInputCode('');
        setLoading(false);
        return; // Count remains strictly untouched
      }

      // 2. Check if already verified in this session
      if (verifiedSet.has(scannedShipment.id)) {
        toast.warning(`Shipment ${scannedShipment.tracking_number} is already verified.`);
        setInputCode('');
        setLoading(false);
        return;
      }

      // 3. Valid match: Add to verified set
      const updatedVerified = new Set(verifiedSet);
      updatedVerified.add(scannedShipment.id);
      setVerifiedSet(updatedVerified);
      toast.success(`Verified: ${scannedShipment.tracking_number} (${updatedVerified.size}/${verifyQueue.length})`);

      // 4. Check completion condition
      if (updatedVerified.size === verifyQueue.length) {
        toast.success('All boxes in the batch successfully verified!');
        // Optional: Perform automated batch status update in DB here if desired
      }

      setInputCode('');
    } catch (err) {
      console.error('Scan error:', err);
      toast.error(err.message || 'Failed to process scan');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBatch = async () => {
    if (verifiedSet.size < verifyQueue.length) {
      toast.error(`Cannot complete batch: ${verifyQueue.length - verifiedSet.size} shipments still pending.`);
      return;
    }

    try {
      setLoading(true);
      // Example: Bulk update status in Supabase
      const { error } = await supabase
        .from('shipments')
        .update({ status: 'Out for Delivery' }) // or whatever target status
        .in('id', verifyQueue);

      if (error) throw error;

      toast.success('Batch status updated successfully!');
      localStorage.removeItem('verify_queue');
      navigate('/driver-portal/shipments');
    } catch (err) {
      console.error('Batch update error:', err);
      toast.error('Failed to update shipment batch status.');
    } finally {
      setLoading(false);
    }
  };

  const remainingCount = verifyQueue.length - verifiedSet.size;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex">
      <div className="hidden md:flex">
        <DriverSidebar activePage="scan" />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-28 md:pb-6">
        <div className="hidden md:block">
          <DriverHeader title="Batch Verify Shipments" subtitle="" />
        </div>

        <div className="p-6 space-y-6 max-w-4xl w-full mx-auto">
          
          {/* Progress Banner */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-emerald-900 text-sm">Truck Load Verification</h3>
                <p className="text-xs font-bold text-emerald-700">
                  Verified: {verifiedSet.size} / {verifyQueue.length} &bull; Remaining: {remainingCount}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('verify_queue');
                navigate('/driver-portal/shipments');
              }}
              className="px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              Cancel / Exit
            </button>
          </div>

          {/* Scanner Input Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Scan className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="font-black text-xl text-slate-900 tracking-tight">
                Scan Box QR Label
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Scan barcodes sequentially. Unmatched boxes will trigger a warning and will not change your target count.
              </p>
            </div>

            <form onSubmit={handleScanSubmit} className="max-w-md mx-auto flex gap-2">
              <input 
                ref={inputRef}
                type="text" 
                placeholder="Scan or type tracking code..." 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 transition-colors"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !inputCode.trim()}
                className="px-5 py-3 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-slate-900 rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify</span>}
              </button>
            </form>
          </div>

          {/* Checklist of Selected Boxes */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">Queue Checklist</h3>
              <span className="text-xs font-bold text-slate-500">{verifyQueue.length} items targeted</span>
            </div>

            <div className="divide-y divide-slate-100">
              {queueShipmentsData.map((s) => {
                const isVerified = verifiedSet.has(s.id);
                return (
                  <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {s.tracking_number}
                      </span>
                      <div className="text-slate-500 font-semibold pt-1">
                        {s.recipient_name || s.client_name || 'Client'} &bull; {s.destination || 'Destination'}
                      </div>
                    </div>
                    <div>
                      {isVerified ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-black inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold">
                          Pending Scan
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {verifiedSet.size === verifyQueue.length && verifyQueue.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleCompleteBatch}
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm and Finalize Batch</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}