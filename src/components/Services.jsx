import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Services() {
  const navigate = useNavigate();
  
  // Initialize with 'ocean' so it locks onto Sea Freight by default
  const [activeService, setActiveService] = useState('ocean');
  
  // Track hovered tab for the popup dropdown menu
  const [hoveredTab, setHoveredTab] = useState(null);

  const services = [
    {
      id: 'air',
      title: 'Air Freight',
      bgMedia: '/airfreight.mp4',
      type: 'video',
      path: '/air-freight', // Route path reference
    },
    {
      id: 'ground',
      title: 'Ground Freight',
      bgMedia: '/groundfreight.mp4',
      type: 'video',
      path: '/ground-freight', // Route path reference
    },
    {
      id: 'ocean',
      title: 'Sea Freight',
      bgMedia: '/ocean.mp4',
      type: 'video',
      path: '/sea-freight', // Route path reference (adjust if needed)
    },
    {
      id: 'warehousing',
      title: 'Warehousing Services',
      bgImage: '/warehouse-hover.png',
      type: 'image',
      path: '/warehousing', // Route path reference
    },
  ];

  const activeData = services.find((s) => s.id === activeService) || services[2];
  const videoRef = useRef(null);

  // Force video play and explicit source load when the active service changes
  useEffect(() => {
    if (activeData.type === 'video' && videoRef.current) {
      videoRef.current.load();
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log("Video playback safely handled:", err.name);
        });
      }
    }
  }, [activeService]);

  return (
    <section className="w-full min-h-screen relative flex flex-col bg-black text-white overflow-hidden">
      
      {/* Header Section */}
      <div className="w-full h-64 md:h-80 bg-[#1c1917] flex items-center justify-center relative z-25 border-b border-white/10 shrink-0">
        <h2 className="text-white text-5xl md:text-7xl font-extrabold uppercase tracking-tighter">
          OUR SERVICES
        </h2>
      </div>

      {/* Main Interactive Banner Area */}
      <div className="flex-grow relative w-full flex items-stretch overflow-hidden min-h-[600px]">
        
        {/* Pre-render ALL media layers simultaneously in the DOM with crossfade transitions to eliminate pop-in lag */}
        <div className="absolute inset-0 z-0 transform-gpu backface-hidden">
          {services.map((service) => {
            const isCurrentActive = service.id === activeService;

            return (
              <div
                key={service.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out transform-gpu backface-hidden ${
                  isCurrentActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {service.type === 'video' ? (
                  <video 
                    ref={service.id === activeService ? videoRef : null}
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    preload="auto"
                    className="w-full h-full object-cover transform-gpu"
                  >
                    <source src={service.bgMedia} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div 
                    className="w-full h-full bg-cover bg-center bg-no-repeat transform-gpu"
                    style={{ backgroundImage: `url(${service.bgImage})` }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 z-20 pointer-events-none" />

        {/* Navigation Bar at the Top */}
        <div className="absolute top-0 left-0 right-0 z-30 w-full grid grid-cols-2 md:grid-cols-4 gap-0 p-0 m-0">
          {services.map((service) => {
            const isActive = activeService === service.id;
            const isHovered = hoveredTab === service.id;

            return (
              <div 
                key={service.id}
                onMouseEnter={() => {
                  setActiveService(service.id);
                  setHoveredTab(service.id);
                }}
                onMouseLeave={() => setHoveredTab(null)}
                className="relative cursor-pointer"
              >
                {/* Main Navigation Item Box */}
                <div className={`py-5 px-3 transition-colors duration-300 border-0 text-center flex flex-col items-center justify-center ${
                  isActive 
                    ? 'bg-white/10 backdrop-blur-md border-b-2 border-yellow-500 shadow-lg shadow-black/40' 
                    : 'bg-transparent hover:bg-white/5'
                }`}>
                  <div className="flex flex-col items-center w-full select-none">
                    <h3 className={`text-sm md:text-base font-black uppercase tracking-wider truncate w-full transition-colors duration-300 ${
                      isActive ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-white/80 hover:text-white'
                    }`}>
                      {service.title}
                    </h3>
                  </div>
                </div>

                {/* Dropdown Container with smooth dropping and routing execution */}
                <div className={`absolute top-full left-0 right-0 bg-black/95 border border-white/10 border-t-0 p-3 shadow-2xl flex flex-col items-center justify-center z-40 transform-gpu origin-top transition-all duration-300 ease-out ${
                  isHovered 
                    ? 'opacity-100 translate-y-0 scale-y-100 pointer-events-auto' 
                    : 'opacity-0 -translate-y-2 scale-y-95 pointer-events-none'
                }`}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(service.path);
                    }}
                    className="group relative w-full py-2.5 px-3 bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-black text-sm md:text-base font-black uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-yellow-500/30 flex items-center justify-center gap-2 cursor-pointer overflow-hidden rounded-sm"
                  >
                    {/* Subtle internal shine animation */}
                    <span className="absolute inset-0 w-full h-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    <span className="truncate">Learn More</span>
                    
                    <svg 
                      className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1 shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
      
      {/* Footer Spacing */}
      <div className="w-full h-20 bg-[#1c1917] border-t border-white/10 z-25 shrink-0" />
    </section>
  );
}