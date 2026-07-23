import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, MapPin, Package, ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";

function Shipping() {
  const navigate = useNavigate();
  const { createNewShipment } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  
  const [formData, setFormData] = useState({
    senderName: "",
    senderAddress: "",
    recipientName: "",
    recipientAddress: "",
    weight: "",
    contents: "merchandise"
  });

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Fire our dispatcher to store it globally
    const trackingId = createNewShipment(formData);
    setGeneratedId(trackingId);
    setSubmitted(true);
  }

  return (
    <section className="relative min-h-screen bg-slate-950 text-white pt-28 pb-16 px-5 md:px-8 overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] -top-20 left-10 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div key="shipping-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -25 }}>
              <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">Create a Shipment</h1>
                <p className="text-slate-400 text-sm mt-2 font-medium">Fill out the distribution details below to arrange your courier pick-up.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200 border-b border-slate-800/60 pb-3 uppercase tracking-wider"><User size={16} className="text-blue-400" /><span>1. Sender Info</span></h2>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                      <input required type="text" name="senderName" value={formData.senderName} onChange={handleChange} placeholder="John Doe" className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500/80 outline-none text-sm transition" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Pickup Address</label>
                      <input required type="text" name="senderAddress" value={formData.senderAddress} onChange={handleChange} placeholder="123 Main St, Seattle, WA" className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500/80 outline-none text-sm transition" />
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200 border-b border-slate-800/60 pb-3 uppercase tracking-wider"><MapPin size={16} className="text-blue-400" /><span>2. Recipient Info</span></h2>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Recipient Name</label>
                      <input required type="text" name="recipientName" value={formData.recipientName} onChange={handleChange} placeholder="Jane Smith" className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500/80 outline-none text-sm transition" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Delivery Address</label>
                      <input required type="text" name="recipientAddress" value={formData.recipientAddress} onChange={handleChange} placeholder="456 Oak Rd, New York, NY" className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500/80 outline-none text-sm transition" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6">
                  <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200 border-b border-slate-800/60 pb-3 mb-4 uppercase tracking-wider"><Package size={16} className="text-blue-400" /><span>3. Package Metrics</span></h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Estimated Weight (lbs)</label>
                      <input required type="number" min="1" name="weight" value={formData.weight} onChange={handleChange} placeholder="5" className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500/80 outline-none text-sm transition" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Contents</label>
                      <select name="contents" value={formData.contents} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 rounded-xl border border-slate-800 focus:border-blue-500/80 outline-none text-sm transition text-slate-300">
                        <option value="Merchandise">General Merchandise</option>
                        <option value="Documents">Sensitive Documents</option>
                        <option value="Electronics">Fragile Electronics</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                    <span>Confirm & Dispatch</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div key="shipping-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center bg-slate-900/40 border border-slate-900/80 rounded-3xl p-8 md:p-10 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 text-emerald-400"><CheckCircle2 size={36} /></div>
              <h2 className="text-2xl font-black tracking-tight">Waybill Registered!</h2>
              <p className="text-slate-400 text-sm mt-2 font-medium">Your shipping order was dispatched successfully into the system telemetry layer.</p>
              <div className="mt-6 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tracking Reference Key</p>
                <p className="text-2xl font-mono font-black text-blue-400 tracking-wider mt-1">{generatedId}</p>
              </div>
              <div className="grid gap-3 mt-8">
                <button onClick={() => navigate("/dashboard")} className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2"><ClipboardList size={16} /><span>Return to Dashboard</span></button>
                <button onClick={() => setSubmitted(false)} className="w-full text-sm font-bold text-slate-500 hover:text-slate-400 transition py-1">Create Another Order</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default Shipping;