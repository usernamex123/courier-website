import React, { useState } from 'react';
import { Check } from 'lucide-react';

export default function WhyChooseUs() {
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleEmailClick = (email) => {
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_blank');
  };

  const handlePhoneClick = (phone) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => {
      setCopiedPhone(false);
    }, 2000);
  };

  const handleVisitClick = () => {
    const locationSection = document.getElementById('our-location');
    if (locationSection) {
      locationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="about-us" className="bg-[#1c1917] py-20 text-stone-100 overflow-hidden font-brand">
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12">
        
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            About <span className="text-yellow-500">Us</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-14 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <p className="text-slate-200 text-base sm:text-lg md:text-xl font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              We are the dominant force in global logistics, engineering hyper-personalized supply chain dominance to shatter industry standards. JB Logistics doesn't just transport; we architect high-velocity growth engines for your enterprise.
            </p>
            <p className="text-slate-200 text-base sm:text-lg md:text-xl font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Your mission is our obsession. We operate on a razor-sharp philosophy of radical efficiency and extreme flexibility, guaranteeing that your freight is moved with military-grade precision.
            </p>
          </div>

          <div className="lg:col-span-6 relative p-6">
            <div className="absolute top-0 left-0 w-24 h-24 border-l-4 border-t-4 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)]"></div>
            <div className="w-full h-[340px] overflow-hidden rounded-none shadow-2xl relative z-10 border border-white/10">
              <img 
                src="/modern.jpg" 
                alt="City Skyline" 
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 border-r-4 border-b-4 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)]"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 border-t border-white/10 pt-12">
          
          <div 
            onClick={() => handlePhoneClick("+1 (216) 569-5350")}
            className="group cursor-pointer bg-white/5 px-6 py-5 border border-white/10 hover:border-yellow-500/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-center min-h-[96px]"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className={`transition-all duration-300 ${copiedPhone ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
              <p className="text-yellow-500 font-bold text-[11px] uppercase tracking-widest mb-1">Call Us</p>
              <p className="text-sm sm:text-base font-bold text-white group-hover:text-yellow-400 transition-colors">+1 (216) 569-5350</p>
            </div>

            {copiedPhone && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md border border-yellow-500/40 shadow-[0_0_25px_rgba(234,179,8,0.2)] flex items-center justify-center gap-2.5 animate-fade-in z-20">
                <div className="w-7 h-7 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow-lg">
                  <Check size={16} strokeWidth={3} />
                </div>
                <span className="text-sm sm:text-base font-black tracking-wider text-yellow-400 uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  Copied
                </span>
              </div>
            )}
          </div>

          <div 
            onClick={() => handleEmailClick("customer_care@jblogisticsservices.com")}
            className="group cursor-pointer bg-white/5 px-6 py-5 border border-white/10 hover:border-yellow-500/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-center min-h-[96px]"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <p className="text-yellow-500 font-bold text-[11px] uppercase tracking-widest mb-1">Email Us</p>
            <p className="text-sm sm:text-base font-bold text-white group-hover:text-yellow-400 transition-colors truncate">customer_care@jblogisticsservices.com</p>
          </div>

          <div 
            onClick={handleVisitClick}
            className="group cursor-pointer bg-white/5 px-6 py-5 border border-white/10 hover:border-yellow-500/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-center min-h-[96px]"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <p className="text-yellow-500 font-bold text-[11px] uppercase tracking-widest mb-1">Visit Us</p>
            <p className="text-sm sm:text-base font-bold text-white group-hover:text-yellow-400 transition-colors">850 Euclid Ave, Cleveland, OH 44114, USA</p>
          </div>

        </div>
      </div>
    </section>
  );
}