import React from 'react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-black text-white border-t border-white/10 px-8 py-16 relative overflow-hidden font-brand">
      {/* Subtle background glow effect for modern styling */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
        
        {/* Left Side: Text-based Branding + Tagline */}
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black uppercase tracking-wider text-white">
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-white bg-clip-text text-transparent">JB</span> Logistics
            </span>
          </div>
          <p className="text-sm font-medium tracking-[0.2em] text-gray-400 uppercase">
            Global Supply Chain Solutions
          </p>
        </div>

        {/* Right Side: Copyright */}
        <div className="text-gray-500 text-sm font-medium">
          © 2026 JB Logistics. All rights reserved.
        </div>
        
      </div>
    </footer>
  );
}