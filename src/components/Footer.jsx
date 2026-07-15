function Footer() {
  return (
    <footer id="contact" className="bg-black text-white border-t border-white/10 px-8 py-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        
        {/* Left Side: Logo + Branding */}
        <div className="flex flex-col items-start gap-2 mb-8 md:mb-0">
          <img 
            src="/126737.png" 
            alt="JB Logistics Logo" 
            className="h-24 w-auto object-contain" 
          />
          <div className="flex flex-col">
            <span className="text-3xl font-black uppercase tracking-wider text-white">JB Logistics</span>
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">
              Global Supply Chain Solutions
            </span>
          </div>
        </div>

        {/* Right Side: Copyright */}
        <div className="text-gray-600 font-bold">
          © 2026 JB Logistics. All rights reserved.
        </div>
        
      </div>
    </footer>
  );
}

export default Footer;