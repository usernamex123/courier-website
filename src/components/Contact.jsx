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

        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-start justify-center max-w-4xl mx-auto mb-12 w-full">
          
          <div className="space-y-6 text-center md:text-left">
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
                className="text-base font-semibold text-center md:text-left block text-gray-800 w-full hover:text-yellow-600 transition-colors duration-300 cursor-pointer group"
              >
                850 EUCLID AVE STE 819<br />
                CLEVELAND, OH 44114
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-yellow-600 font-extrabold uppercase tracking-widest">Phone</p>
              <div className="flex justify-center md:justify-start">
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

          <div className="flex flex-col items-center md:items-start space-y-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-yellow-600">Follow Us</span>
            <div className="flex gap-6 text-gray-900 items-center">
              <a href="#" className="hover:text-yellow-600 transition-colors duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="hover:text-yellow-600 transition-colors duration-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="hover:text-yellow-600 transition-colors duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
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