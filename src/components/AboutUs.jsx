import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export default function AboutUs() {
  const [activeTab, setActiveTab] = useState(0);

  const capabilities = [
    {
      id: "speed",
      tag: "01 / EFFICIENCY",
      title: "QUICK SERVICE",
      desc: "Modeled after industry-leading enterprise distribution networks, our routing systems eliminate transit bottlenecks. We guarantee rapid turnaround times to keep your supply chain continuously moving forward.",
      img: "/main.jpg"
    },
    {
      id: "support",
      tag: "02 / DEDICATION",
      title: "24/7 SUPPORT",
      desc: "Logistics never sleeps. Our command center operates round-the-clock, pairing dedicated account managers with active telematics so you maintain total visibility and proactive support at every mile.",
      img: "/2nd.jpg"
    },
    {
      id: "reliability",
      tag: "03 / SECURITY",
      title: "RELIABILITY",
      desc: "From high-value commercial cargo to fragile freight, we enforce rigorous safety protocols and compliance standards. Your shipments are handled with maximum security and absolute structural integrity.",
      img: "/3rd.jpg"
    }
  ];

  // Auto-rotation set to 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % capabilities.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [capabilities.length]);

  return (
    <section id="about-us" className="relative w-full min-h-[1050px] bg-black flex flex-col items-center justify-center py-28 overflow-hidden font-brand">
      
      {/* Full Section Background Image with Faint Top & Solid Bottom */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="/aboutusbackground.png" 
          alt="About Us Background City" 
          className="w-full h-full object-cover grayscale contrast-125 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.7)_50%,rgba(0,0,0,1)_100%)] [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.7)_50%,rgba(0,0,0,1)_100%)]"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Soft gradient overlay to harmonize the transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
      </div>

      {/* Subtle Atmospheric Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-yellow-500/[0.04] blur-[120px] rounded-full z-0 pointer-events-none" />

      {/* Background Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] z-0 pointer-events-none" />

      {/* Corporate Header Section */}
      <div className="relative z-10 flex flex-col items-center mb-16 text-center px-4 max-w-4xl mx-auto">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] mb-3">
          WHY CHOOSE <span className="text-yellow-500">US</span>
        </h2>
        <p className="text-yellow-500/90 font-extrabold uppercase tracking-widest text-xs sm:text-sm mb-4">
          Built For Your Success
        </p>
        <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed max-w-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Fast, secure, and reliable logistics designed to keep your business moving smoothly every step of the way.
        </p>
      </div>

      {/* Interactive Enterprise Layout Grid */}
      <div className="relative z-10 w-full max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Interactive Selection Navigation */}
        <div className="lg:col-span-4 flex flex-col justify-start gap-4">
          <div className="flex flex-col gap-3">
            {capabilities.map((item, index) => {
              const isActive = index === activeTab;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(index)}
                  className={`group relative p-5 border transition-all duration-500 cursor-pointer rounded-none text-left flex flex-col justify-between overflow-hidden backdrop-blur-md ${
                    isActive 
                      ? 'bg-black/80 border-yellow-500 shadow-[0_0_35px_rgba(234,179,8,0.2)]' 
                      : 'bg-black/60 border-white/10 hover:border-white/30 hover:bg-black/70'
                  }`}
                >
                  {/* Left Active Glow Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 ${isActive ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,1)]' : 'bg-transparent'}`} />

                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${isActive ? 'text-yellow-500' : 'text-slate-400'}`}>
                      {item.tag}
                    </span>
                    <div className={`transition-transform duration-300 ${isActive ? 'rotate-0 text-yellow-500 scale-110' : '-rotate-45 text-white/30 group-hover:text-white/80'}`}>
                      <ArrowUpRight size={16} />
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-1">
                    {item.title}
                  </h3>

                  <p className={`text-xs transition-colors duration-300 leading-relaxed line-clamp-2 ${isActive ? 'text-slate-200' : 'text-slate-300'}`}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Immersive Showcase Panel */}
        <div className="lg:col-span-8 relative h-[560px] sm:h-[620px] rounded-none overflow-hidden border border-white/25 bg-black shadow-2xl flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 1.03, filter: "brightness(0.4)" }}
              animate={{ opacity: 1, scale: 1, filter: "brightness(0.9)" }}
              exit={{ opacity: 0, scale: 0.97, filter: "brightness(0.4)" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <img 
                src={capabilities[activeTab].img} 
                alt={capabilities[activeTab].title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none" />

              {/* Bottom Editorial Content Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-8 sm:p-10 text-left bg-gradient-to-t from-black via-black/85 to-transparent">
                <span className="text-yellow-500 font-extrabold text-xs uppercase tracking-[0.25em] mb-2 block">
                  {capabilities[activeTab].tag}
                </span>
                <h4 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-3">
                  {capabilities[activeTab].title}
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
                  {capabilities[activeTab].desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}