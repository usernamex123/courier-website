import React, { useState, useEffect } from 'react';

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const [preloadMap, setPreloadMap] = useState(false);

  const emailAddress = "customer_care@jblogisticsservices.com";
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddress)}`;
  const phoneNumber = "+1 (216) 569-5350";

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleAddressClick = () => {
    const locationSection = document.getElementById('our-location');
    if (locationSection) {
      locationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreloadMap(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="contact-us" className="w-full bg-[#f3f6fb] text-gray-900 py-20 px-5 sm:px-6 md:px-24 font-brand relative overflow-hidden">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/[0.05] blur-[140px] rounded-none pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        
        <div className="flex flex-col items-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-yellow-500 uppercase mb-3 text-center">
            CONTACT <span>US</span>
          </h2>
          <div className="w-20 h-1 bg-yellow-500 rounded-none"></div>
        </div>

        <div className="max-w-4xl mx-auto mb-12 w-full">
          
          <div className="space-y-6 text-left">
            <div className="space-y-1">
              <p className="text-xs text-yellow-600 font-extrabold uppercase tracking-widest">Email</p>
              <a 
                href={gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-semibold block transition-colors duration-300 hover:text-yellow-600 break-words"
              >
                {emailAddress}
              </a>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-yellow-600 font-extrabold uppercase tracking-widest">Address</p>
              <div 
                onClick={handleAddressClick}
                className="text-base font-semibold block text-gray-800 w-full hover:text-yellow-600 transition-colors duration-300 cursor-pointer group"
              >
                850 EUCLID AVE STE 819<br />
                CLEVELAND, OH 44114
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-yellow-600 font-extrabold uppercase tracking-widest">Phone</p>
              <div className="flex justify-start">
                <button 
                  onClick={handleCopyPhone}
                  className="group/phone inline-flex items-center gap-2 text-base font-semibold text-left transition-colors duration-300 hover:text-yellow-600 cursor-pointer"
                >
                  <span>{phoneNumber}</span>
                  {copied ? (
                    <span className="inline-flex items-center gap-1 text-xs text-yellow-700 font-bold bg-yellow-100 px-2 py-0.5 rounded-none transition-all">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Copied
                    </span>
                  ) : (
                    <svg className="w-4 h-4 opacity-50 group-hover/phone:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

        <div id="our-location" className="pt-4 flex flex-col items-center text-center scroll-mt-24 w-full">
          <div className="w-full max-w-5xl">
            <div className="rounded-none overflow-hidden border border-gray-300 h-72 md:h-96 shadow-lg w-full">
              {preloadMap && (
                <iframe
                  title="JB Logistics HQ"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-81.693%2C41.498%2C-81.688%2C41.502&layer=mapnik&marker=41.5002%2C-81.6908"
                  className="w-full h-full grayscale"
                />
              )}
            </div>
          </div>
        </div>

      </div>

    </section>
  );
}