import React from 'react';

export default function Footer() {
  const emailAddress = "customer_care@jblogisticsservices.com";
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddress)}`;

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn(`Element with id "${id}" not found on the page.`);
    }
  };

  const handleServiceClick = (e, serviceId) => {
    e.preventDefault();
    const bannerElement = document.getElementById('service-banner');
    if (bannerElement) {
      bannerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn('Video banner element not found. Check ID.');
    }
    window.dispatchEvent(new CustomEvent('change-service-tab', { detail: serviceId }));
  };

  return (
    <footer className="bg-[#0B132B] text-white border-t border-white/15 px-5 sm:px-6 md:px-16 py-10 relative overflow-hidden font-brand">
      {/* Subtle background glow effect for modern styling */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10 pb-8 border-b border-white/10 w-full">
        
        {/* Column 1: Brand & Tagline */}
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black uppercase tracking-wider text-white">
              <span className="text-yellow-500">JB</span> LOGISTICS
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Delivering trusted logistics solutions with speed, safety, and reliability across America and beyond.
          </p>
        </div>

        {/* Column 2: Services */}
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-black uppercase tracking-wider text-white">Services</h3>
          <ul className="flex flex-col gap-2 text-sm text-gray-400 font-medium">
            <li>
              <a 
                href="#service-banner" 
                onClick={(e) => handleServiceClick(e, 'ground')} 
                className="hover:text-yellow-500 transition-colors cursor-pointer"
              >
                Ground Freight
              </a>
            </li>
            <li>
              <a 
                href="#service-banner" 
                onClick={(e) => handleServiceClick(e, 'air')} 
                className="hover:text-yellow-500 transition-colors cursor-pointer"
              >
                Air Freight
              </a>
            </li>
            <li>
              <a 
                href="#service-banner" 
                onClick={(e) => handleServiceClick(e, 'warehousing')} 
                className="hover:text-yellow-500 transition-colors cursor-pointer"
              >
                Warehousing
              </a>
            </li>
            <li>
              <a 
                href="#service-banner" 
                onClick={(e) => handleServiceClick(e, 'ocean')} 
                className="hover:text-yellow-500 transition-colors cursor-pointer"
              >
                Sea Freight
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-black uppercase tracking-wider text-white">Company</h3>
          <ul className="flex flex-col gap-2 text-sm text-gray-400 font-medium">
            <li>
              <a 
                href="#about" 
                onClick={(e) => scrollToSection(e, 'about')} 
                className="hover:text-yellow-500 transition-colors cursor-pointer"
              >
                About Us
              </a>
            </li>
            <li>
              <a 
                href="#contact-us" 
                onClick={(e) => scrollToSection(e, 'contact-us')} 
                className="hover:text-yellow-500 transition-colors cursor-pointer"
              >
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Contact Us */}
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-black uppercase tracking-wider text-white">Contact Us</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-gray-400">
            <li className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>850 EUCLID AVE STE 819, CLEVELAND, OH 44114</span>
            </li>
            <li className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <span>+1 (216) 569-5350</span>
            </li>
            <li className="flex items-start gap-2.5">
              <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <a href={gmailUrl} target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500 transition-colors break-words">
                {emailAddress}
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 w-full text-center sm:text-left">
        <div>© 2026 JB Logistics. All rights reserved.</div>
        <div className="flex gap-6">
          <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}