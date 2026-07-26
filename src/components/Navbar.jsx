import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Package, LayoutDashboard, Truck, LogOut, LogIn, ChevronDown } from "lucide-react";

function Navbar() {
  const { isLoggedIn, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Handle premium blur effect injection upon page scroll
  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-collapse mobile drawer and dropdown upon routing execution
  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
  }, [location]);

  async function handleSignOut() {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Authentication exit link failure:", err);
    }
  }

  // Smooth scroll handler function for anchor sections, with fallback navigation if on another route
  const handleScrollTo = (e, id) => {
    e.preventDefault();
    setMobileOpen(false);
    setServicesOpen(false);
    
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-slate-950/70 backdrop-blur-xl border-b border-slate-900/80 py-4 shadow-lg shadow-slate-950/20" 
          : "bg-transparent border-b border-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between">
        
        {/* Brand Identity Logo with updated B color and bolder thick divider line */}
        <Link to="/" className="flex flex-col items-start group !outline-none !ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="flex items-center text-lg md:text-xl font-black tracking-tight text-white !outline-none !ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0">
            <span className="text-yellow-400">J</span>
            <span className="text-yellow-400">B</span>
            <span className="text-white ml-2">LOGISTICS</span>
          </div>
          <div className="w-full h-[2.5px] bg-yellow-400 my-1 rounded-full"></div>
          <span className="text-[10px] tracking-[0.3em] font-bold text-stone-300 uppercase">
            SERVICES
          </span>
        </Link>

        {/* Desktop Interface Navigation Lanes */}
        <nav className="hidden md:flex items-center gap-1 font-medium text-sm text-slate-300">
          
          {/* Services Dropdown Container */}
          <div 
            className="relative" 
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button 
              onClick={() => setServicesOpen(!servicesOpen)}
              onMouseEnter={() => setServicesOpen(true)}
              className="px-4 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer hover:text-white"
            >
              <span>Services</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${servicesOpen ? "rotate-180" : ""}`} />
            </button>
            
            <AnimatePresence>
              {servicesOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 10 }} 
                  transition={{ duration: 0.2 }} 
                  className="absolute top-full left-0 w-56 z-[100] pt-2"
                >
                  <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-900 p-1.5 shadow-2xl rounded-2xl flex flex-col space-y-1">
                    <a 
                      href="#ground-freight" 
                      onClick={(e) => handleScrollTo(e, 'ground-freight')}
                      className="px-4 py-2.5 rounded-xl transition text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-900/40 cursor-pointer"
                    >
                      Ground Freight
                    </a>
                    <a 
                      href="#air-freight" 
                      onClick={(e) => handleScrollTo(e, 'air-freight')}
                      className="px-4 py-2.5 rounded-xl transition text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-900/40 cursor-pointer"
                    >
                      Air Freight
                    </a>
                    <a 
                      href="#sea-freight" 
                      onClick={(e) => handleScrollTo(e, 'sea-freight')}
                      className="px-4 py-2.5 rounded-xl transition text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-900/40 cursor-pointer"
                    >
                      Sea Freight
                    </a>
                    <a 
                      href="#warehousing" 
                      onClick={(e) => handleScrollTo(e, 'warehousing')}
                      className="px-4 py-2.5 rounded-xl transition text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-900/40 cursor-pointer"
                    >
                      Warehousing
                    </a>
                    <a 
                      href="#get-started" 
                      onClick={(e) => handleScrollTo(e, 'get-started')}
                      className="px-4 py-2.5 rounded-xl transition text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-900/40 cursor-pointer"
                    >
                      Freight Quote
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a 
            href="#contact-us" 
            onClick={(e) => handleScrollTo(e, 'contact-us')}
            className="px-4 py-2 rounded-xl transition hover:text-white cursor-pointer"
          >
            Contact Us
          </a>
          
          {/* Desktop About Us Link */}
          <a 
            href="#about-us" 
            onClick={(e) => handleScrollTo(e, 'about-us')}
            className="px-4 py-2 rounded-xl transition hover:text-white cursor-pointer"
          >
            About Us
          </a>
          
          {isLoggedIn && (
            <Link to="/dashboard" className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${location.pathname === "/dashboard" ? "text-blue-400 bg-slate-900/40" : "hover:text-white"}`}>
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </Link>
          )}
        </nav>

        {/* Desktop Call To Actions & Yellow REQUEST A QUOTE Button */}
        <div className="hidden md:flex items-center gap-3">
          <a 
            href="#get-started"
            onClick={(e) => handleScrollTo(e, 'get-started')}
            className="bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-black px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-yellow-400/20 transition-all shrink-0 cursor-pointer"
          >
            <Truck size={15} />
            <span>Request A Quote</span>
          </a>

          {isLoggedIn ? (
            <button 
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 hover:bg-slate-900 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link 
              to="/auth"
              className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/10 transition-all shrink-0"
            >
              <LogIn size={14} />
              <span>Login/Sign Up</span>
            </Link>
          )}
        </div>

        {/* Mobile Sidebar Trigger Key Toggle */}
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 md:hidden hover:border-slate-700 transition focus:outline-none text-slate-200 cursor-pointer"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

      </div>

      {/* Mobile Sidebar Drawer Overlay Drawer Panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute top-full left-0 w-full bg-slate-950 border-b border-slate-900 overflow-hidden md:hidden shadow-2xl"
          >
            <div className="px-5 py-6 space-y-3 flex flex-col text-base font-semibold text-slate-300">
              
              {/* Mobile Submenu for Services */}
              <div className="space-y-1">
                <div className="p-2 text-xs font-bold uppercase tracking-wider text-slate-500">Services Navigation</div>
                <a 
                  href="#ground-freight" 
                  onClick={(e) => handleScrollTo(e, 'ground-freight')}
                  className="block p-2 rounded-lg hover:text-white cursor-pointer"
                >
                  Ground Freight
                </a>
                <a 
                  href="#air-freight" 
                  onClick={(e) => handleScrollTo(e, 'air-freight')}
                  className="block p-2 rounded-lg hover:text-white cursor-pointer"
                >
                  Air Freight
                </a>
                <a 
                  href="#sea-freight" 
                  onClick={(e) => handleScrollTo(e, 'sea-freight')}
                  className="block p-2 rounded-lg hover:text-white cursor-pointer"
                >
                  Sea Freight
                </a>
                <a 
                  href="#warehousing" 
                  onClick={(e) => handleScrollTo(e, 'warehousing')}
                  className="block p-2 rounded-lg hover:text-white cursor-pointer"
                >
                  Warehousing
                </a>
                <a 
                  href="#get-started" 
                  onClick={(e) => handleScrollTo(e, 'get-started')}
                  className="block p-2 rounded-lg hover:text-white cursor-pointer"
                >
                  Freight Quote
                </a>
              </div>

              <div className="h-[1px] bg-slate-900 my-1" />

              <a 
                href="#contact-us" 
                onClick={(e) => handleScrollTo(e, 'contact-us')}
                className="p-2 rounded-lg hover:text-white cursor-pointer"
              >
                Contact Us
              </a>
              
              {/* Mobile About Us Link */}
              <a 
                href="#about-us" 
                onClick={(e) => handleScrollTo(e, 'about-us')}
                className="p-2 rounded-lg hover:text-white cursor-pointer"
              >
                About Us
              </a>
              
              <a 
                href="#get-started"
                onClick={(e) => handleScrollTo(e, 'get-started')}
                className="w-full bg-yellow-400 text-black text-center font-extrabold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider mt-2 cursor-pointer"
              >
                <Truck size={18} />
                <span>Request A Quote</span>
              </a>

              {isLoggedIn ? (
                <>
                  <div className="h-[1px] bg-slate-900 my-2" />
                  <Link to="/dashboard" className={`p-2 rounded-lg flex items-center gap-2 ${location.pathname === "/dashboard" ? "text-blue-400 bg-slate-900/60" : ""}`}>
                    <LayoutDashboard size={16}/>
                    <span>User Dashboard</span>
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left p-2 rounded-lg text-red-400 hover:bg-red-500/5 transition flex items-center gap-2 mt-4 cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Terminate Session</span>
                  </button>
                </>
              ) : (
                <Link 
                  to="/auth"
                  className="w-full mt-2 bg-blue-500 text-white text-center font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <LogIn size={16} />
                  <span>Login/Sign Up</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;