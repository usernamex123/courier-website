import { useState } from "react";

export default function Services() {
  const [hovered, setHovered] = useState(false);

  return (
    <section className="w-full bg-slate-950 mt-16">
      <div 
        className="relative w-full h-[400px] cursor-pointer group border-y border-white/5 overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Background Layer using CSS background utilities */}
        <div 
          className={`absolute inset-0 bg-center bg-no-repeat transition-all duration-700 ease-in-out ${
            hovered ? "bg-[url('/truck-hover.jpg')] bg-cover" : "bg-[url('/truck-default.jpg')] bg-cover"
          }`}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-500" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-5">
          <h2 className="text-white/70 text-xs font-bold tracking-[0.4em] uppercase mb-3">
            Our Services
          </h2>
          <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            GROUND FREIGHT
          </h3>
          <div className="mt-6 w-16 h-1 bg-blue-500 rounded-full transition-all duration-500 group-hover:w-32" />
        </div>
      </div>
    </section>
  );
}