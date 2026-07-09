import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { ArrowRight, Clock } from "lucide-react";

function Hero() {
  const { isLoggedIn } = useApp();
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen bg-slate-950 text-white flex items-center justify-center pt-24 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] -top-40 -left-20 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] bottom-0 right-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-8 relative z-10 text-center grid lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Messaging Node */}
        <div className="lg:col-span-6 text-left space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-blue-400 uppercase tracking-wider"
          >
            <Clock size={12} />
            <span>Next-Gen Logistics Framework</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1]"
          >
            Smart Nationwide Shipping, <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Streamlined.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-base md:text-lg max-w-xl font-medium leading-relaxed"
          >
            Ship freight seamlessly, track high-fidelity delivery telemetry in real time, and scale your product dispatch workflows with SwiftShip.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
          >
            <button 
              onClick={() => navigate(isLoggedIn ? "/shipping" : "/auth")}
              className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white px-8 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10 transition-all"
            >
              <span>{isLoggedIn ? "Create Shipment" : "Get Started"}</span>
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => navigate("/quote")}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-8 py-4 rounded-xl font-bold text-sm transition-colors text-center"
            >
              Calculate Quote
            </button>
          </motion.div>
        </div>

        {/* Right Graphical Stage: Pure Parallax Illusion Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:col-span-6 hidden lg:block relative w-full select-none"
        >
          <div className="w-full h-80 bg-gradient-to-b from-slate-950 to-slate-900/40 border border-slate-900 rounded-3xl relative overflow-hidden shadow-2xl flex items-end justify-center pb-12">
            
            {/* Layer 1: Distant Skyline Silhouette (Moving Right to Left) */}
            <div className="absolute inset-0 flex w-[200%] opacity-10 pointer-events-none">
              <motion.div 
                animate={{ x: ["0%", "-50%"] }}
                transition={{ ease: "linear", duration: 32, repeat: Infinity }}
                className="flex w-full h-full items-end pb-12 justify-around"
              >
                <div className="flex items-end gap-8 w-full justify-around px-4">
                  <div className="w-12 h-36 bg-slate-700 rounded-t-lg" />
                  <div className="w-20 h-44 bg-slate-700 rounded-t-lg" />
                  <div className="w-16 h-28 bg-slate-700 rounded-t-lg" />
                  <div className="w-24 h-52 bg-slate-700 rounded-t-lg" />
                  <div className="w-14 h-38 bg-slate-700 rounded-t-lg" />
                </div>
                <div className="flex items-end gap-8 w-full justify-around px-4">
                  <div className="w-12 h-36 bg-slate-700 rounded-t-lg" />
                  <div className="w-20 h-44 bg-slate-700 rounded-t-lg" />
                  <div className="w-16 h-28 bg-slate-700 rounded-t-lg" />
                  <div className="w-24 h-52 bg-slate-700 rounded-t-lg" />
                  <div className="w-14 h-38 bg-slate-700 rounded-t-lg" />
                </div>
              </motion.div>
            </div>

            {/* Layer 2: Solid Asphalt Road Base */}
            <div className="absolute bottom-0 left-0 w-full h-14 bg-slate-900/60 border-t border-slate-900" />

            {/* Layer 3: Slower Moving Highway Lane Markings */}
            <div className="absolute bottom-6 left-0 w-[200%] h-[3px] overflow-hidden">
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ ease: "linear", duration: 1.6, repeat: Infinity }} // Slowed down from 0.5s to 1.6s for a smoother cruise
                className="w-full h-full flex justify-around px-6"
              >
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="w-14 h-full bg-slate-800 rounded-full" />
                ))}
              </motion.div>
            </div>

            {/* Layer 4: Compact Aesthetic Truck (Smooth Ride, Facing Forward Right) */}
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-20 flex items-end mb-1 filter drop-shadow-[0_10px_20px_rgba(59,130,246,0.15)]"
            >
              {/* Perfectly Replicated Cute Truck SVG */}
              <svg width="140" height="75" viewBox="0 0 140 75" fill="none" xmlns="http://www.w3.org/2000/svg">
                
                {/* Standard Rectangular Blue Cargo Container Box */}
                <rect x="30" y="10" width="62" height="42" rx="3" fill="#3B82F6" />
                
                {/* Sleek Dark Cabin Base Frame */}
                <path d="M91 22H112C121.5 22 126 27.5 126 36.5V52H91V22Z" fill="#1E293B" />
                {/* Matching White Outer Cabin Accent Cut */}
                <path d="M110.5 22.5H91.5V51.5H125.5V37C125.5 28.5 120 22.5 110.5 22.5Z" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
                
                {/* Cabin Window Highlight */}
                <path d="M96 27H110C114.5 27 117 29.5 117 34V39H96V27Z" fill="#334155" />
                
                {/* Clean Lower Matte Under-Chassis Guard */}
                <rect x="36" y="49" width="84" height="6" rx="3" fill="#1E293B" />
                
                {/* Aesthetic White Hub-Cap Wheels */}
                <circle cx="53" cy="56" r="8" fill="#1E293B" stroke="#FFFFFF" strokeWidth="3" />
                <circle cx="102" cy="56" r="8" fill="#1E293B" stroke="#FFFFFF" strokeWidth="3" />
              </svg>
            </motion.div>

            {/* Layer 5: Strong Deep Vignette Edge Blenders */}
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent pointer-events-none z-30" />
            <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-slate-950 via-slate-950/70 to-transparent pointer-events-none z-30" />

          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default Hero;