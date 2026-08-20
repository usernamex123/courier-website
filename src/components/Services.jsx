import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import ShipmentTracker from '../components/ShipmentTracker'; // Adjust the import path as needed

export default function Services() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeService, setActiveService] = useState('ocean');
  const servicesTopRef = useRef(null);
  const videoRef = useRef(null);

  const services = [
    {
      id: 'ocean',
      title: 'Sea Freight',
      subtitle: 'Global container shipping, port-to-port coordination, and custom ocean logistics.',
      bgMedia: '/ocean.mp4',
      type: 'video',
      path: '/sea-freight',
    },
    {
      id: 'air',
      title: 'Air Freight',
      subtitle: 'High-speed cargo transportation with guaranteed time-sensitive delivery schedules.',
      bgMedia: '/airfreight.mp4',
      type: 'video',
      path: '/air-freight',
    },
    {
      id: 'ground',
      title: 'Ground Freight',
      subtitle: 'Reliable truckload, LTL shipping, and secure cross-country interstate transit.',
      bgMedia: '/groundfreight.mp4',
      type: 'video',
      path: '/ground-freight',
    },
    {
      id: 'warehousing',
      title: 'Warehousing Services',
      subtitle: 'Secure state-of-the-art storage facilities with advanced inventory control systems.',
      bgImage: '/warehouse.jpg',
      type: 'image',
      path: '/warehousing',
    },
  ];

  // Listen for the custom event from the dropdown without changing the URL
  useEffect(() => {
    const handleServiceChange = (e) => {
      if (e.detail) {
        setActiveService(e.detail);
        // Find the banner element and scroll to it, accounting for fixed header
        const bannerElement = document.getElementById('service-banner');
        if (bannerElement) {
          bannerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (servicesTopRef.current) {
          // Fallback to top of section if banner not found
          servicesTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };
    window.addEventListener('change-service-tab', handleServiceChange);
    return () => window.removeEventListener('change-service-tab', handleServiceChange);
  }, []);

  const activeData = services.find((s) => s.id === activeService) || services[0];

  // Auto-play the single active video smoothly upon mount or switch
  useEffect(() => {
    if (activeData.type === 'video' && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Video playback safely handled:", err.name);
      });
    }
  }, [activeService]);

  return (
    <section ref={servicesTopRef} className="w-full relative flex flex-col bg-black text-white overflow-hidden font-brand">
      
      {/* Render the Shipment Tracker from its separate component file */}
      <ShipmentTracker />

      {/* Header Section ("Our Services") */}
      <div className="w-full h-20 md:h-24 bg-[#f3f6fb] flex items-center justify-center relative z-25 border-b border-gray-200 shrink-0 px-6">
        <h2 className="text-yellow-600 text-xl md:text-2xl font-black tracking-tight uppercase">
          Our Services
        </h2>
      </div>

      {/* Main Interactive Banner Area: Optimized mobile height */}
      <div id="service-banner" className="relative w-full flex items-center overflow-hidden min-h-[480px] md:min-h-[650px] scroll-mt-20">
        
        <div className="absolute inset-0 z-0 transform-gpu backface-hidden scale-105">
          {activeData.type === 'video' ? (
            <video 
              ref={videoRef}
              key={activeData.id}
              autoPlay 
              loop 
              muted 
              playsInline 
              preload="auto"
              className="w-full h-full object-cover transform-gpu backface-hidden translate-x-[2%]"
            >
              <source src={activeData.bgMedia} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div 
              key={activeData.id}
              className="w-full h-full bg-cover bg-center bg-no-repeat transform-gpu transition-opacity duration-500"
              style={{ backgroundImage: `url(${activeData.bgImage})` }}
            />
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30 z-10 pointer-events-none" />

        {/* Navigation Bar at the Top */}
        <div className="absolute top-0 left-0 right-0 z-30 w-full grid grid-cols-2 md:grid-cols-4 gap-0 p-0 m-0 bg-black/40 backdrop-blur-md border-b border-white/10">
          {services.map((service) => {
            const isActive = activeService === service.id;

            return (
              <div 
                key={service.id}
                onMouseEnter={() => setActiveService(service.id)}
                onClick={() => setActiveService(service.id)}
                className="relative cursor-pointer"
              >
                <div className={`py-4 md:py-5 px-3 md:px-4 transition-all duration-300 border-0 text-center flex flex-col items-center justify-center ${
                  isActive 
                    ? 'bg-white/10 backdrop-blur-md border-b-4 border-yellow-500 shadow-lg' 
                    : 'bg-transparent hover:bg-white/5'
                }`}>
                  <div className="flex items-center justify-center gap-2 w-full select-none">
                    <h3 className={`text-xs sm:text-sm md:text-base font-bold tracking-normal truncate w-full transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-white/80 hover:text-white'
                    }`}>
                      {service.title}
                    </h3>
                    <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 text-yellow-500 ${isActive ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Content Display Area */}
        <div className="relative z-20 w-full max-w-4xl px-6 md:px-16 lg:px-24 flex flex-col items-start text-left pt-32 pb-12 md:py-20">
          <span className="text-yellow-500 font-bold uppercase tracking-widest text-xs md:text-sm mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Core Service Offerings
          </span>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] leading-[1.1] mb-4 md:mb-6">
            {activeData.title}
          </h1>
          
          <p className="text-slate-200 text-sm sm:text-lg md:text-xl max-w-xl font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {activeData.subtitle}
          </p>
        </div>

      </div>

    </section>
  );
}