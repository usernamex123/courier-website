import { useState, useEffect, useRef } from "react";
import { ChevronDown, ArrowUp, Home } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const lastScrollY = useRef(0);
  const location = useLocation();

  // Check if we are currently on a sub-page (e.g., ground-freight, international, etc., anything other than home)
  const isSubPage = location.pathname !== "/" && location.pathname !== "";

  // Automatically close dropdown when changing pages via routing
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close dropdown immediately if the user starts scrolling the page
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsOpen(false);

      if (currentScrollY > lastScrollY.current) {
        if (currentScrollY > 100) setIsScrolled(true);
      } else {
        if (currentScrollY < 200) setIsScrolled(false);
      }
      setShowBackToTop(currentScrollY > 500);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const HeaderContent = ({ height }) => (
    <div className={`max-w-7xl mx-auto px-5 flex justify-between items-center w-full ${height}`}>
      <Link to="/" className="flex flex-col items-center font-brand ml-2">
        <div className="border-2 border-yellow-500/50 px-1 py-0.5 rounded-[4px] leading-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
          <div className="text-3xl font-bold tracking-tight flex items-center leading-none">
            <span className="text-yellow-500">J</span>
            <span className="text-white">JB LOGISTICS</span>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-white text-center border-t border-yellow-500/30 mt-0.5 leading-none">
            Services
          </div>
        </div>
      </Link>
      
      <div className="flex items-center gap-6 md:gap-8">
        {/* Dynamic Home Option wrapped in a group so hover transitions both text and icon together */}
        {isSubPage && (
          <Link 
            to="/" 
            className="group flex items-center gap-1.5 text-sm md:text-base font-black uppercase tracking-wider text-white hover:text-yellow-500 transition-colors duration-1000 ease-in-out"
          >
            <Home size={16} className="text-white group-hover:text-yellow-500 transition-colors duration-1000 ease-in-out" />
            <span>Home</span>
          </Link>
        )}

        {/* Services Dropdown Container */}
        <div 
          className="relative h-[60px] flex items-center justify-center" 
          onMouseLeave={() => setIsOpen(false)}
        >
          <button 
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={() => setIsOpen(true)}
            className="flex items-center gap-1 text-sm md:text-base font-black uppercase tracking-wider transition-colors duration-1000 ease-in-out text-white hover:text-yellow-500 cursor-pointer h-full"
          >
            Services <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
          </button>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 10 }} 
                transition={{ duration: 0.2 }} 
                className="absolute top-[60px] left-0 w-64 z-[100]"
              >
                <div className="bg-black/40 backdrop-blur-lg border border-white/10 p-1 shadow-2xl">
                  <Link to="/ground-freight" onClick={() => setIsOpen(false)} className="block px-6 py-5 text-white transition-colors duration-1000 ease-in-out hover:text-yellow-500 hover:bg-white/5 text-sm font-semibold uppercase tracking-wide">
                    Ground Freight
                  </Link>
                  <Link to="/international" onClick={() => setIsOpen(false)} className="block px-6 py-5 text-white transition-colors duration-1000 ease-in-out hover:text-yellow-500 hover:bg-white/5 text-sm font-semibold uppercase tracking-wide">
                    International
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <Link to="/quote" className="text-sm md:text-base font-black uppercase tracking-wider transition-colors duration-1000 ease-in-out text-white hover:text-yellow-500">Freight Quote</Link>
        <Link to="/contact" className="text-sm md:text-base font-black uppercase tracking-wider transition-colors duration-1000 ease-in-out text-white hover:text-yellow-500">Contact Us</Link>
        <Link to="/about" className="text-sm md:text-base font-black uppercase tracking-wider transition-colors duration-1000 ease-in-out text-white hover:text-yellow-500">About Us</Link>

        {/* Request A Quote Button */}
        <Link 
          to="/quote" 
          className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-black px-6 py-3 rounded-none font-black text-sm uppercase tracking-wider inline-flex items-center justify-center text-center transition-all duration-300 shrink-0 ml-2"
        >
          <span>Request A Quote</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full text-white">
      <nav className="w-full absolute top-0 z-50 py-6">
        <HeaderContent height="h-[60px]" />
      </nav>

      <AnimatePresence>
        {isScrolled && (
          <motion.div 
            initial={{ y: -150, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -150, opacity: 0, transition: { duration: 0 } }} 
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 w-full z-40 bg-white/5 backdrop-blur-xl border-b border-white/10 h-[93px] flex items-center shadow-sm"
          >
            <HeaderContent height="h-[93px]" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <main>
        <Outlet />
      </main>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={scrollToTop} 
            className="fixed bottom-8 right-8 z-[100] bg-yellow-600 p-3 shadow-lg hover:bg-yellow-700 transition-all duration-300 text-white"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}