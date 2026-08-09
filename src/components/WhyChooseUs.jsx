import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const points = [
  "Comprehensive global freight forwarding network",
  "End-to-end supply chain visibility and management",
  "Dedicated account managers for enterprise clients",
];

export default function WhyChooseUs() {
  return (
    <section id="about" className="bg-[#f3f6fb] pt-20 pb-24 lg:pt-28 lg:pb-36 relative z-30 overflow-hidden font-brand text-gray-900">
      {/* Yellow shiny/gradient on the right side */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-yellow-500/10 to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-14 items-center">
        
        {/* Left Column: Image on top (z-20) with yellow frame behind it (z-10) */}
        <div className="relative">
          <div className="absolute -top-5 -left-5 w-28 h-28 border-4 border-yellow-500 rounded-2xl pointer-events-none z-10" />
          
          <div className="overflow-hidden rounded-2xl shadow-xl relative z-20 border border-gray-300">
            <img
              src="/modern.jpg"
              alt="Logistics warehouse operations"
              className="w-full object-cover h-[500px]"
            />
          </div>
        </div>

        {/* Right Column: Content and Points */}
        <div className="space-y-6">
          <div>
            <span className="text-yellow-600 font-bold text-sm uppercase tracking-widest">About Us</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight leading-tight uppercase">
              Modern logistics engineered for speed and reliability.
            </h2>
            <p className="text-gray-600 mt-5 leading-relaxed text-base sm:text-lg">
              JB Logistics is a full-service logistics partner combining a global freight network with cutting-edge technology. From multinational manufacturers to fast-growing e-commerce brands, we design supply chains that are faster, smarter, and greener.
            </p>
          </div>

          <ul className="space-y-3 pt-2">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-gray-800">
                <CheckCircle2 className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base font-medium">{p}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
}