import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AboutUs() {
  const [activeIndex, setActiveIndex] = useState(0);

  const banners = [
    { 
      id: "quick", 
      title: "QUICK SERVICE", 
      desc: "We prioritize operational efficiency to ensure your time is fully respected.", 
      img: "/main.jpg" 
    },
    { 
      id: "support", 
      title: "24/7 SUPPORT", 
      desc: "Dedicated professional assistance available whenever you require it.", 
      img: "/2nd.jpg" 
    },
    { 
      id: "reliability", 
      title: "RELIABILITY", 
      desc: "We ensure your valuables reach their destination safely and strictly on schedule.", 
      img: "/3rd.jpg" 
    }
  ];

  // Auto-slide effect set to 3000ms (3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 3000);
    
    return () => clearInterval(timer);
  }, [banners.length]);

  const springConfig = { type: "spring", stiffness: 250, damping: 30, mass: 1 };

  return (
    <section className="relative w-full h-[850px] bg-black flex flex-col items-center pt-16 overflow-hidden">
      <div className="flex flex-col items-center mb-12">
        <h2 className="text-white text-5xl font-black tracking-wider mb-3">WHY US</h2>
        <div className="w-30 h-1.5 bg-yellow-400 rounded-full"></div>
      </div>

      {/* Main Banner Container */}
      <div className="relative z-10 w-full max-w-6xl h-[600px] flex items-center justify-center">
        {banners.map((banner, index) => {
          const isActive = index === activeIndex;
          const offset = (index - activeIndex) * 65; 
          
          return (
            <motion.div
              key={banner.id}
              layoutId={banner.id}
              initial={false}
              animate={{
                x: `${offset}%`,
                scale: isActive ? 1 : 0.85,
                opacity: isActive ? 1 : 0.6,
                zIndex: isActive ? 20 : 10 - Math.abs(index - activeIndex)
              }}
              transition={springConfig}
              className="absolute rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              style={{ width: "800px", height: "600px" }}
            >
              <img src={banner.img} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 w-full h-32 bg-black/50"></div>
              <div className="absolute bottom-0 w-full h-32 flex flex-col items-center justify-start pt-4 z-20 px-8 text-center">
                <h3 className="text-3xl font-black text-white mb-1">{banner.title}</h3>
                <p className="text-lg font-semibold text-white/95 leading-snug max-w-sm">{banner.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div className="flex gap-4 mt-8 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`transition-all duration-300 rounded-full ${
              index === activeIndex 
                ? "w-4 h-4 bg-white" 
                : "w-3 h-3 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

      {/* Left Arrow */}
      <div className="group absolute left-0 top-0 h-full w-[20%] z-[100]">
        {activeIndex > 0 && (
          <button 
            onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
            className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white hover:text-yellow-400 cursor-pointer outline-none"
          >
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}
      </div>

      {/* Right Arrow */}
      <div className="group absolute right-0 top-0 h-full w-[20%] z-[100]">
        {activeIndex < banners.length - 1 && (
          <button 
            onClick={() => setActiveIndex((prev) => Math.min(banners.length - 1, prev + 1))}
            className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white hover:text-yellow-400 cursor-pointer outline-none"
          >
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}
      </div>
    </section>
  );
}