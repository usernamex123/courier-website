import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ArrowUp, Home, Menu, X, ShieldCheck } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabase";
import Login from "./Login"; // Cleanly imported Login/Register component

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
  return `${protocol}//${hostname}:5000`;
};

const API_URL = getApiUrl();

export default function Layout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // --- ADMIN BACKEND SESSION STATE ---
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  // --- CLIENT USER & DRIVER ROLE STATE ---
  const [user, setUser] = useState(null);
  const [isCustomer, setIsCustomer] = useState(() => {
    try {
      return !!localStorage.getItem('customer_session');
    } catch {
      return false;
    }
  });
  const [isDriver, setIsDriver] = useState(() => {
    try {
      return !!localStorage.getItem('driver_data');
    } catch {
      return false;
    }
  });
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  const lastScrollY = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();

  const isSubPage = location.pathname !== "/" && location.pathname !== "";
  
  // Check backend admin session status
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/session`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.authenticated) {
            setIsAdminAuth(true);
            return;
          }
        }
      } catch (err) {
        console.error('Admin session check error:', err);
      }
      setIsAdminAuth(false);
    };

    checkAdminSession();
  }, [location.pathname]);

  // Check Supabase client user session and driver local storage session
  useEffect(() => {
    let isMounted = true;

    // Check localStorage for driver data immediately on mount
    const cachedDriver = localStorage.getItem('driver_data');
    if (cachedDriver) {
      try {
        const driverObj = JSON.parse(cachedDriver);
        if (driverObj) {
          if (isMounted) {
            setIsDriver(true);
            setIsCheckingRole(false);
          }
        }
      } catch (e) {
        localStorage.removeItem('driver_data');
      }
    }

    const checkDriverStatus = async (userId) => {
      try {
        const profileQuery = supabase
          .from('driver_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile check timeout')), 3000)
        );

        const { data, error } = await Promise.race([profileQuery, timeout]);

        if (isMounted) {
          if (!error && data) {
            setIsDriver(true);
            localStorage.setItem('driver_data', JSON.stringify({
              id: data.id,
              driver_id: data.driver_id || data.id,
              name: data.name || 'Driver',
              status: data.status || 'On Field',
              ...data
            }));
          } else if (!localStorage.getItem('driver_data')) {
            setIsDriver(false);
          }
        }
      } catch (err) {
        console.error('Error checking driver profile:', err);
      } finally {
        if (isMounted) setIsCheckingRole(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      
      if (!currentUser) {
        if (isMounted) {
          setUser(null);
          setIsCustomer(false);
          localStorage.removeItem('customer_session');
          if (!localStorage.getItem('driver_data')) {
            setIsDriver(false);
            setIsCheckingRole(false);
          } else {
            setIsCheckingRole(false);
          }
        }
        return;
      }

      if (isMounted) {
        setUser(currentUser);
        setIsCustomer(true);
        localStorage.setItem('customer_session', 'true');
      }

      const cachedDriver = localStorage.getItem('driver_data');
      if (cachedDriver) {
        try {
          const driverObj = JSON.parse(cachedDriver);
          if (driverObj) {
            if (isMounted) {
              setIsDriver(true);
              setIsCheckingRole(false);
            }
            return;
          }
        } catch (e) {
          localStorage.removeItem('driver_data');
        }
      }

      checkDriverStatus(currentUser.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      if (isMounted) {
        setUser(currentUser);
        if (currentUser) {
          setIsCustomer(true);
          localStorage.setItem('customer_session', 'true');
        } else {
          setIsCustomer(false);
          localStorage.removeItem('customer_session');
        }
      }
      if (currentUser) {
        setIsCheckingRole(true);
        checkDriverStatus(currentUser.id);
      } else {
        if (isMounted && !localStorage.getItem('driver_data')) {
          setIsDriver(false);
          setIsCheckingRole(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      await fetch(`${API_URL}/api/driver/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(() => {});
    } catch (err) {
      console.error('Server logout error:', err);
    }
    await supabase.auth.signOut();
    localStorage.removeItem('driver_data');
    localStorage.removeItem('driver_session');
    localStorage.removeItem('customer_session');
    setUser(null);
    setIsCustomer(false);
    setIsDriver(false);
    setIsCheckingRole(false);
    setIsAdminAuth(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    setIsOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileServicesOpen(false);
  }, [location.pathname]);

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

  const handleHomeScroll = (e, id) => {
    e.preventDefault();
    setIsOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileServicesOpen(false);

    let targetId = id;
    if (id === 'about-us') targetId = 'about';

    if (targetId === 'about' || targetId === 'contact-us') {
      const scrollToTarget = () => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(scrollToTarget, 150);
      } else {
        setTimeout(scrollToTarget, 50);
      }
      return;
    }

    let serviceKey = 'ocean';
    if (id === 'ground-freight') serviceKey = 'ground';
    else if (id === 'air-freight') serviceKey = 'air';
    else if (id === 'warehousing') serviceKey = 'warehousing';
    else if (id === 'sea-freight') serviceKey = 'ocean';

    const executeServiceScroll = () => {
      const bannerElement = document.getElementById('service-banner');
      if (bannerElement) {
        bannerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      window.dispatchEvent(new CustomEvent('change-service-tab', { detail: serviceKey }));
    };

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(executeServiceScroll, 150);
    } else {
      setTimeout(executeServiceScroll, 50);
    }
  };

  const HeaderContent = ({ height }) => (
    <div className={`max-w-7xl mx-auto px-4 sm:px-5 flex justify-between items-center w-full ${height}`}>
      <Link to="/" className="flex items-center gap-2.5 sm:gap-4 ml-1 group">
        <span className="text-3xl sm:text-6xl font-black tracking-tight text-yellow-500 leading-none">JB</span>
        <div className="self-stretch w-[2px] bg-yellow-500/80 my-0.5"></div>
        <div className="flex flex-col justify-between">
          <span className="text-lg sm:text-3xl font-black tracking-tight leading-none text-white">LOGISTICS</span>
          <div className="w-full h-[2px] bg-yellow-500 my-1"></div>
          <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-[0.35em] text-yellow-500 leading-none">SERVICES</span>
        </div>
      </Link>
      
      <div className="hidden md:flex items-center gap-6 lg:gap-8">
        {isSubPage && (
          <Link to="/" className="group flex items-center gap-1.5 text-sm md:text-base font-black uppercase tracking-wider text-white hover:text-yellow-500 transition-colors duration-300">
            <Home size={16} className="text-white group-hover:text-yellow-500 transition-colors duration-300" />
            <span>Home</span>
          </Link>
        )}

        <div className="relative h-[60px] flex items-center justify-center" onMouseLeave={() => setIsOpen(false)}>
          <button onClick={() => setIsOpen(!isOpen)} onMouseEnter={() => setIsOpen(true)} className="flex items-center gap-1 text-sm md:text-base font-black uppercase tracking-wider text-white hover:text-yellow-500 cursor-pointer h-full">
            Services <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
          </button>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2, ease: "easeOut" }} className="absolute top-[60px] left-0 w-64 z-[100]">
                <div className="bg-black/90 backdrop-blur-md border border-white/10 p-1 shadow-2xl">
                  <a href="#ground-freight" onClick={(e) => handleHomeScroll(e, 'ground-freight')} className="block px-6 py-4 text-white hover:text-yellow-500 hover:bg-white/5 text-sm font-semibold uppercase tracking-wide cursor-pointer">Ground Freight</a>
                  <a href="#air-freight" onClick={(e) => handleHomeScroll(e, 'air-freight')} className="block px-6 py-4 text-white hover:text-yellow-500 hover:bg-white/5 text-sm font-semibold uppercase tracking-wide cursor-pointer">Air Freight</a>
                  <a href="#sea-freight" onClick={(e) => handleHomeScroll(e, 'sea-freight')} className="block px-6 py-4 text-white hover:text-yellow-500 hover:bg-white/5 text-sm font-semibold uppercase tracking-wide cursor-pointer">Sea Freight</a>
                  <a href="#warehousing" onClick={(e) => handleHomeScroll(e, 'warehousing')} className="block px-6 py-4 text-white hover:text-yellow-500 hover:bg-white/5 text-sm font-semibold uppercase tracking-wide cursor-pointer">Warehousing</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <a href="#about" onClick={(e) => handleHomeScroll(e, 'about-us')} className="text-sm md:text-base font-black uppercase tracking-wider text-white hover:text-yellow-500 cursor-pointer">About Us</a>
        <a href="#contact-us" onClick={(e) => handleHomeScroll(e, 'contact-us')} className="text-sm md:text-base font-black uppercase tracking-wider text-white hover:text-yellow-500 cursor-pointer">Contact Us</a>

        {user || isCustomer || isDriver ? (
          isCheckingRole && !isDriver && !isCustomer ? (
            <div className="w-36 h-12 rounded-full bg-white/10 animate-pulse ml-2" />
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <Link 
                to={isDriver ? "/driver-portal" : "/Dashboard"} 
                className="px-6 py-3 rounded-full bg-yellow-500 text-white font-extrabold text-sm tracking-wide shadow-lg cursor-pointer select-none hover:bg-yellow-400 transition-colors flex items-center gap-2"
              >
                <span>{isDriver ? "Driver Portal" : "Customer Portal"}</span>
              </Link>
            </div>
          )
        ) : (
          <Login />
        )}
      </div>

      <div className="flex md:hidden items-center gap-2.5">
        {(user || isCustomer || isDriver) && (!isCheckingRole || isDriver || isCustomer) && (
          <Link 
            to={isDriver ? "/driver-portal" : "/Dashboard"} 
            className="px-3 py-1.5 rounded-full bg-yellow-500 text-white font-bold text-[11px] flex items-center gap-1 shadow"
          >
            <span>{isDriver ? "Driver Portal" : "Customer Portal"}</span>
          </Link>
        )}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white cursor-pointer">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full text-white overflow-x-hidden">
      <nav className="w-full absolute top-0 z-50 py-4 sm:py-6">
        <HeaderContent height="h-[50px] sm:h-[60px]" />
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsMobileServicesOpen(false);
              }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" 
            />

            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              className="md:hidden fixed top-[74px] left-0 w-full bg-[#0d0b0a]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 flex flex-col gap-4 z-40 shadow-2xl max-h-[calc(100vh-74px)] overflow-y-auto"
            >
              {isSubPage && (
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white py-3 border-b border-white/10">
                  <Home size={18} className="text-yellow-500" /> Home
                </Link>
              )}

              <div>
                <button onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)} className="w-full flex items-center justify-between text-sm font-black uppercase tracking-wider text-white py-3 border-b border-white/10">
                  <span>Services</span>
                  <ChevronDown size={16} className={`transition-transform duration-300 ${isMobileServicesOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isMobileServicesOpen && (
                  <div className="flex flex-col pl-4 py-2 gap-2 bg-white/5 border-l-2 border-yellow-500 my-2">
                    <a href="#ground-freight" onClick={(e) => handleHomeScroll(e, 'ground-freight')} className="py-2 text-xs font-bold text-stone-300 uppercase">Ground Freight</a>
                    <a href="#air-freight" onClick={(e) => handleHomeScroll(e, 'air-freight')} className="py-2 text-xs font-bold text-stone-300 uppercase">Air Freight</a>
                    <a href="#sea-freight" onClick={(e) => handleHomeScroll(e, 'sea-freight')} className="py-2 text-xs font-bold text-stone-300 uppercase">Sea Freight</a>
                    <a href="#warehousing" onClick={(e) => handleHomeScroll(e, 'warehousing')} className="py-2 text-xs font-bold text-stone-300 uppercase">Warehousing</a>
                  </div>
                )}
              </div>

              <a href="#about" onClick={(e) => handleHomeScroll(e, 'about-us')} className="text-sm font-black uppercase tracking-wider text-white py-3 border-b border-white/10">About Us</a>
              <a href="#contact-us" onClick={(e) => handleHomeScroll(e, 'contact-us')} className="text-sm font-black uppercase tracking-wider text-white py-3 border-b border-white/10">Contact Us</a>

              {!user && !isCustomer && !isDriver && (
                <div className="pt-2">
                  <Login />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isScrolled && (
          <motion.div initial={{ y: -150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -150, opacity: 0, transition: { duration: 0 } }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="fixed top-0 left-0 w-full z-40 bg-white/5 backdrop-blur-xl border-b border-white/10 h-[74px] sm:h-[93px] flex items-center shadow-sm">
            <HeaderContent height="h-[74px] sm:h-[93px]" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="w-full">
        <Outlet />
      </main>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} onClick={scrollToTop} className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[100] bg-yellow-600 p-2.5 sm:p-3 shadow-lg hover:bg-yellow-700 transition-all duration-300 text-white cursor-pointer">
            <ArrowUp size={20} className="sm:w-6 sm:h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}