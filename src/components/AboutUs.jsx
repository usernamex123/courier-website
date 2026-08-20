import React, { useState, useEffect, useCallback } from "react";
import { Globe2, Headphones, Leaf, Lock, Gauge, ChevronLeft, ChevronRight } from "lucide-react";

const reasons = [
  { 
    icon: Globe2, 
    title: "Nationwide US Coverage", 
    desc: "Coast-to-coast delivery across all 50 states, routed from a single centralized hub — no branches, no middlemen.", 
    img: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=1200&q=80" 
  },
  { 
    icon: Headphones, 
    title: "Personalized Service", 
    desc: "One dedicated point of contact for every shipment — direct, responsive, and built around your business.", 
    img: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&q=80" 
  },
  { 
    icon: Leaf, 
    title: "Modern Eco Fleet", 
    desc: "A brand-new, fuel-efficient vehicle fleet that keeps emissions low on every US route we run.", 
    img: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&q=80" 
  },
  { 
    icon: Lock, 
    title: "Secure & Insured", 
    desc: "Fully insured cargo and verified drivers on every movement — your goods protected end to end.", 
    img: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=80" 
  },
  { 
    icon: Gauge, 
    title: "Fast & Flexible", 
    desc: "Agile routing and same-week scheduling from a fresh, fast-moving team built for growing businesses.", 
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80" 
  },
];

export default function WhyChooseUs() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = reasons.length;

  const go = useCallback((dir) => setActive((p) => (p + dir + count) % count), [count]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((p) => (p + 1) % count), 5000);
    return () => clearInterval(t);
  }, [paused, count]);

  const current = reasons[active];

  return (
    <section 
      id="why" 
      className="bg-[#0B132B] py-20 lg:py-28 relative overflow-x-hidden" 
      onMouseEnter={() => setPaused(true)} 
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background Glow / Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-yellow-500/[0.03] blur-[120px] rounded-full z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-yellow-500 font-bold text-sm uppercase tracking-widest">Why Choose Us</span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mt-2 tracking-tight">A fresh, US-focused logistics partner</h2>
          <p className="text-white/60 mt-4">Newly launched and proudly operating across the United States — modern tech, a dedicated team, and cargo handled like our own.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 items-stretch w-full">
          {/* Slide: Shorter mobile height h-[420px], desktop maintains exact lg:h-[440px] */}
          <div className="lg:col-span-3 w-full min-w-0 relative rounded-3xl overflow-hidden group h-[420px] lg:h-[440px] border border-white/10 shadow-2xl bg-black">
            {reasons.map((r, i) => (
              <img
                key={r.title}
                src={r.img}
                alt={r.title}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${i === active ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Arrows */}
            <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 backdrop-blur hover:bg-yellow-500 hover:text-black text-white flex items-center justify-center transition-colors z-20">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Next" className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 backdrop-blur hover:bg-yellow-500 hover:text-black text-white flex items-center justify-center transition-colors z-20">
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Content: Balanced padding for the refined mobile height */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-10 z-10 w-full">
              <div className="flex items-center gap-3 mb-2 sm:mb-4">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-yellow-500 text-black flex items-center justify-center shadow-lg shrink-0">
                  <current.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <span className="text-yellow-400 font-bold text-xs sm:text-sm tracking-widest uppercase">{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
              </div>
              <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-white mb-1.5 sm:mb-2">{current.title}</h3>
              <p className="text-white/80 max-w-full sm:max-w-md leading-relaxed text-xs sm:text-sm break-words">{current.desc}</p>
            </div>

            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/15 z-20">
              <div key={active + (paused ? "p" : "r")} className="h-full bg-yellow-500" style={{ animation: paused ? "none" : "whyprogress 5s linear forwards" }} />
            </div>
          </div>

          {/* Tab list */}
          <div className="lg:col-span-2 w-full min-w-0 flex flex-col gap-2.5 justify-between">
            {reasons.map((r, i) => {
              const isActive = i === active;
              return (
                <button
                  key={r.title}
                  onClick={() => setActive(i)}
                  className={`w-full flex items-center gap-4 rounded-2xl p-3.5 text-left border transition-all cursor-pointer backdrop-blur-md ${
                    isActive 
                      ? "bg-white/10 border-yellow-500/50 shadow-lg ring-1 ring-yellow-500/20" 
                      : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-yellow-500 text-black shadow-md" : "bg-white/10 text-white/70"}`}>
                    <r.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`font-semibold text-sm ${isActive ? "text-white" : "text-white/80"}`}>{r.title}</div>
                    <div className="text-xs text-white/50 truncate mt-0.5">{r.desc}</div>
                  </div>
                  <span className={`ml-auto text-xs font-bold transition-colors ${isActive ? "text-yellow-500" : "text-white/30"}`}>{String(i + 1).padStart(2, "0")}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`@keyframes whyprogress { from { width: 0% } to { width: 100% } }`}</style>
    </section>
  );
}