import React, { useState } from 'react';

export default function Contact() {
  const [showMap, setShowMap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);

  const emailAddress = "customer_care@jblogisticsservices.com";
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddress)}`;
  const phoneNumber = "+1 (216) 569-5350";

  // Company Address
  const companyAddress = "850 EUCLID AVE STE 819 CLEVELAND OH 44114";

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Clean, fast static Google Map source centered on the company address
  const mapIframeSrc = `https://maps.google.com/maps?q=${encodeURIComponent(companyAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <section id="contact-us" className="w-full bg-[#1c1917] text-white py-16 px-6 md:px-24 font-sans relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Heading */}
        <div className="flex flex-col items-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter uppercase text-center mb-2">
            CONTACT US
          </h1>
          <div className="w-20 h-1 bg-yellow-400 rounded-full"></div>
        </div>

        {/* HORIZONTAL ALIGNMENT: 3 Columns */}
        <div className="grid md:grid-cols-3 gap-12 items-start">
          
          {/* COLUMN 1: Contact Info */}
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-xs text-yellow-500 font-extrabold uppercase tracking-widest">Email</p>
              <a 
                href={gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-semibold block transition-colors duration-300 hover:text-yellow-400"
              >
                {emailAddress}
              </a>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-yellow-500 font-extrabold uppercase tracking-widest">Address</p>
              <button 
                onClick={() => {
                  setShowMap(true);
                  setIsMapLoading(true);
                }}
                className="text-base font-semibold text-left block transition-colors duration-300 hover:text-yellow-400 cursor-pointer w-full"
              >
                850 EUCLID AVE STE 819 6941<br />
                CLEVELAND, OH 44114<br />
                
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-yellow-500 font-extrabold uppercase tracking-widest">Phone</p>
              <button 
                onClick={handleCopyPhone}
                className="group/phone inline-flex items-center gap-2 text-base font-semibold text-left transition-colors duration-300 hover:text-yellow-400 cursor-pointer"
              >
                <span>{phoneNumber}</span>
                {copied ? (
                  <span className="inline-flex items-center gap-1 text-xs text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded-md transition-all">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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

          {/* COLUMN 2: Follow Us */}
          <div className="flex flex-col items-center space-y-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-yellow-500">Follow Us</span>
            <div className="flex gap-6 text-white items-center">
              <a href="#" className="hover:text-yellow-400 transition-colors duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="hover:text-yellow-400 transition-colors duration-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="hover:text-yellow-400 transition-colors duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>

          {/* COLUMN 3: Get In Touch */}
          <div className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight text-right">
              GET IN TOUCH
            </h2>
            <form className="space-y-4">
              <input 
                type="email" 
                placeholder="Enter your email *" 
                className="w-full p-3.5 bg-transparent border-2 border-white/20 text-white placeholder-white/50 outline-none focus:border-yellow-400 transition-colors duration-300 font-semibold text-sm md:text-base" 
              />
              <button 
                type="submit"
                className="w-full bg-transparent text-white font-bold py-4 uppercase tracking-widest border-2 border-white transition-all duration-300 ease-in-out hover:bg-yellow-400 hover:text-black hover:border-yellow-400 shadow-lg cursor-pointer text-sm md:text-base"
              >
                Send
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Embedded Google Map Modal Popup */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-black border border-white/20 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative animate-[scaleIn_0.3s_ease-out]">
            
            {/* Floating Close Button */}
            <button 
              onClick={() => setShowMap(false)}
              className="absolute top-4 right-4 z-25 text-white/80 hover:text-white bg-black/60 hover:bg-black/90 p-2 rounded-full transition-colors cursor-pointer backdrop-blur-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            {/* Embedded Google Map iframe with loading spinner */}
            <div className="w-full h-[480px] bg-black relative flex items-center justify-center">
              {isMapLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 gap-3">
                  <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-yellow-400 font-bold tracking-widest uppercase">Loading Map...</span>
                </div>
              )}
              <iframe
                title="Company Location Map"
                src={mapIframeSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                onLoad={() => setIsMapLoading(false)}
              ></iframe>
            </div>

          </div>
        </div>
      )}

      {/* Tailwind CSS keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </section>
  );
}