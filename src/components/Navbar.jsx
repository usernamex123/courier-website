import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Package, LayoutDashboard, Truck, ClipboardList, LogOut, LogIn } from "lucide-react";

function Navbar() {
  const { isLoggedIn, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Auto-collapse mobile drawer upon routing execution
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  async function handleSignOut() {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Authentication exit link failure:", err);
    }
  }

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled 
          ? "bg-slate-950/70 backdrop-blur-xl border-slate-900/80 py-4 shadow-lg shadow-slate-950/20" 
          : "bg-transparent border-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between">
        
        {/* Brand Identity Logo */}
        <Link to="/" className="flex items-center gap-2.5 group outline-none">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform duration-200">
            <Package size={22} className="transform group-hover:rotate-3 transition-transform" />
          </div>
          <span className="text-lg font-black text-red-600 tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            JB Logistics Services
          </span>
        </Link>

        {/* Desktop Interface Navigation Lanes (Includes Freight Quote) */}
        <nav className="hidden md:flex items-center gap-1 font-medium text-sm text-slate-300">
          <Link to="/services" className={`px-4 py-2 rounded-xl transition ${location.pathname === "/services" ? "text-blue-400 bg-slate-900/40" : "hover:text-white"}`}>Services</Link>
          <Link to="/quote" className={`px-4 py-2 rounded-xl transition ${location.pathname === "/quote" ? "text-blue-400 bg-slate-900/40" : "hover:text-white"}`}>Freight Quote</Link>
          <Link to="/contact" className={`px-4 py-2 rounded-xl transition ${location.pathname === "/contact" ? "text-blue-400 bg-slate-900/40" : "hover:text-white"}`}>Contact Us</Link>
          <Link to="/about" className={`px-4 py-2 rounded-xl transition ${location.pathname === "/about" ? "text-blue-400 bg-slate-900/40" : "hover:text-white"}`}>About Us</Link>
          
          {isLoggedIn && (
            <Link to="/dashboard" className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${location.pathname === "/dashboard" ? "text-blue-400 bg-slate-900/40" : "hover:text-white"}`}>
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </Link>
          )}
        </nav>

        {/* Desktop Call To Actions & Yellow REQUEST A QUOTE Button */}
        <div className="hidden md:flex items-center gap-3">
          <Link 
            to="/quote"
            className="bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-black px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-yellow-400/20 transition-all shrink-0"
          >
            <Truck size={15} />
            <span>Request A Quote</span>
          </Link>

          {isLoggedIn ? (
            <button 
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/30 hover:bg-slate-900 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-2"
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
          className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 md:hidden hover:border-slate-700 transition focus:outline-none text-slate-200"
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
            <div className="px-5 py-6 space-y-4 flex flex-col text-base font-semibold text-slate-300">
              <Link to="/services" className={`p-2 rounded-lg ${location.pathname === "/services" ? "text-blue-400 bg-slate-900/60" : ""}`}>Services</Link>
              <Link to="/quote" className={`p-2 rounded-lg ${location.pathname === "/quote" ? "text-blue-400 bg-slate-900/60" : ""}`}>Freight Quote</Link>
              <Link to="/contact" className={`p-2 rounded-lg ${location.pathname === "/contact" ? "text-blue-400 bg-slate-900/60" : ""}`}>Contact Us</Link>
              <Link to="/about" className={`p-2 rounded-lg ${location.pathname === "/about" ? "text-blue-400 bg-slate-900/60" : ""}`}>About Us</Link>
              
              <Link 
                to="/quote"
                className="w-full bg-yellow-400 text-black text-center font-extrabold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider mt-2"
              >
                <Truck size={18} />
                <span>Request A Quote</span>
              </Link>

              {isLoggedIn ? (
                <>
                  <div className="h-[1px] bg-slate-900 my-2" />
                  <Link to="/dashboard" className={`p-2 rounded-lg flex items-center gap-2 ${location.pathname === "/dashboard" ? "text-blue-400 bg-slate-900/60" : ""}`}>
                    <LayoutDashboard size={16}/>
                    <span>User Dashboard</span>
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left p-2 rounded-lg text-red-400 hover:bg-red-500/5 transition flex items-center gap-2 mt-4"
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