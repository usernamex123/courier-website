import React from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function Hero() {
  const location = useLocation();
  const navigate = useNavigate();

  // Custom handler to scroll to sections on the homepage or navigate home first if on a subpage
  const handleHomeScroll = (e, id) => {
    e.preventDefault();

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section className="relative min-h-[500px] md:min-h-[calc(90vh+189px)] flex items-start justify-start pt-28 md:pt-40 px-4 sm:px-6 md:px-16 lg:px-24 overflow-hidden bg-black font-brand">
      {/* Video Background */}
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
      
      {/* Dark Overlay with subtle gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

      {/* Content */}
      <div className="w-full max-w-4xl relative z-10 text-left flex flex-col items-start text-white">
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", fontWeight: 800 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[0.95] text-white normal-case drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
        >
          Delivering <br />
          <span className="text-yellow-500 drop-shadow-[0_0_25px_rgba(234,179,8,0.4)]">Trust</span> Across <br />
          America<span className="text-yellow-500">.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-200 text-sm sm:text-lg md:text-xl max-w-xl font-normal leading-relaxed mt-4 md:mt-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        >
          End-to-end logistics and courier solutions that connect businesses and people across the nation.
        </motion.p>
        
        {/* Request A Quote Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 md:mt-8 flex items-center gap-4"
        >
          <a 
            href="#get-started" 
            onClick={(e) => handleHomeScroll(e, 'get-started')}
            className="bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-none font-bold text-xs sm:text-sm md:text-base tracking-wider inline-flex items-center gap-3 text-center transition-all duration-300 shrink-0 cursor-pointer shadow-[0_0_25px_rgba(234,179,8,0.4)] hover:shadow-[0_0_35px_rgba(234,179,8,0.6)] uppercase"
          >
            <span>REQUEST A QUOTE</span>
            <ArrowRight size={18} className="transition-transform duration-300 hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;