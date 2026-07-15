import { useState } from "react";
import { motion } from "framer-motion";

export default function AboutUs() {
  const [isSwapped, setIsSwapped] = useState(false);

  const transition = {
    duration: 1.2,
    ease: [0.4, 0, 0.2, 1],
  };

  return (
    <section className="relative w-full h-[850px] bg-black flex flex-col items-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/about-bg.jpg')" }} />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-20 w-full max-w-6xl px-8 flex flex-col items-center">
        <h2 className="text-6xl font-black text-white uppercase tracking-tighter mb-12 border-b-4 border-yellow-500 pb-4">
          About Us
        </h2>
      </div>

      <div className="relative z-10 w-full h-[600px] flex items-center justify-center">
        {/* RELIABILITY BANNER */}
        <motion.div
          layoutId="banner-reliability"
          onClick={() => setIsSwapped(false)}
          transition={transition}
          className={`absolute w-full max-w-4xl h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-white/5 
            ${!isSwapped ? "z-20 scale-100 opacity-100" : "z-10 -translate-x-[40%] scale-75 opacity-40 cursor-pointer"}`}
        >
          <img src="/main.jpg" alt="Reliability" className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 h-[160px] bg-black/60 p-8 text-center text-white">
            <h3 className="text-4xl font-black uppercase">RELIABILITY</h3>
          </div>
        </motion.div>

        {/* INNOVATION BANNER */}
        <motion.div
          layoutId="banner-innovation"
          onClick={() => setIsSwapped(true)}
          transition={transition}
          className={`absolute w-full max-w-4xl h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-white/5 
            ${isSwapped ? "z-20 scale-100 opacity-100" : "z-10 translate-x-[40%] scale-75 opacity-40 cursor-pointer"}`}
        >
          <img src="/2nd.jpg" alt="Innovation" className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 h-[160px] bg-black/60 p-8 text-center text-white">
            <h3 className="text-4xl font-black uppercase">INNOVATION</h3>
          </div>
        </motion.div>

        {/* Right Arrow */}
        <motion.div 
          className="absolute top-0 right-0 z-40 w-32 h-[600px] flex items-center justify-center cursor-pointer bg-gradient-to-l from-black/30 to-transparent"
          animate={{ opacity: !isSwapped ? 1 : 0, pointerEvents: !isSwapped ? "auto" : "none" }}
          transition={transition}
          onClick={() => setIsSwapped(true)}
        >
          <span className="text-white text-6xl font-thin">→</span>
        </motion.div>

        {/* Left Arrow */}
        <motion.div 
          className="absolute top-0 left-0 z-40 w-32 h-[600px] flex items-center justify-center cursor-pointer bg-gradient-to-r from-black/30 to-transparent"
          animate={{ opacity: isSwapped ? 1 : 0, pointerEvents: isSwapped ? "auto" : "none" }}
          transition={transition}
          onClick={() => setIsSwapped(false)}
        >
          <span className="text-white text-6xl font-thin">←</span>
        </motion.div>
      </div>
    </section>
  );
}