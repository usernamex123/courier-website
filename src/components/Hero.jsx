import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { ArrowRight, Clock } from "lucide-react";

function Hero() {
  const { isLoggedIn } = useApp();
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Video Background 
        - Added 'poster' (if you have a thumbnail image, put it in public folder)
        - Added 'preload="auto"' to help it load faster on reload
      */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/video.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay - Prevents the 'black screen' flash by matching the video's dark tone */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-5 md:px-8 relative z-10 text-center flex flex-col items-center text-white">
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
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] mt-6"
        >
          Smart Nationwide Shipping, <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Streamlined.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed mt-6"
        >
          Ship freight seamlessly, track high-fidelity delivery telemetry in real time, and scale your product dispatch workflows with SwiftShip.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
        >
          <button 
            onClick={() => navigate(isLoggedIn ? "/shipping" : "/auth")}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-2 shadow-xl shadow-blue-900/20 transition-all"
          >
            <span>{isLoggedIn ? "Create Shipment" : "Get Started"}</span>
            <ArrowRight size={16} />
          </button>
          <button 
            onClick={() => navigate("/quote")}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-xl font-bold text-sm transition-colors"
          >
            Calculate Quote
          </button>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;