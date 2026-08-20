import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, UserCheck, Menu, X, Settings, LogOut, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileLayout({ children, user, profileData, onLogout, onOpenAuthModal }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  const getProfileInitial = () => {
    const fullName = profileData?.name || user?.user_metadata?.full_name;
    if (fullName && fullName.trim() !== "") {
      return fullName.trim().charAt(0).toUpperCase();
    }
    if (profileData?.email || user?.email) {
      return (profileData?.email || user.email).charAt(0).toUpperCase();
    }
    return "G";
  };

  const currentEmail = (profileData?.email || user?.email || '').trim().toLowerCase();
  const isAdmin = currentEmail === 'admin@jblogisticsservices.com';

  return (
    <div className="min-h-screen w-full bg-[#070605] text-white flex flex-col font-['Inter',sans-serif] selection:bg-yellow-500 selection:text-black overflow-x-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-yellow-500/5 via-amber-500/0 to-transparent blur-[100px] pointer-events-none"></div>

      {/* --- RESPONSIVE MOBILE & DESKTOP HEADER --- */}
      <header className="w-full sticky top-0 z-50 bg-[#090807]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo - Matched to exact primary layout styling */}
          <Link to="/" className="flex items-center gap-3 sm:gap-4 ml-1 group">
            <span className="text-3xl sm:text-5xl font-black tracking-tight text-yellow-500 leading-none">JB</span>
            <div className="self-stretch w-[2px] bg-yellow-500/80 my-0.5"></div>
            <div className="flex flex-col justify-between">
              <span className="text-lg sm:text-2xl font-black tracking-tight leading-none text-white">LOGISTICS</span>
              <div className="w-full h-[2px] bg-yellow-500 my-1"></div>
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.35em] text-yellow-500 leading-none">SERVICES</span>
            </div>
          </Link>

          {/* Desktop Nav & Actions */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-semibold tracking-wide text-stone-300 hover:text-yellow-400 transition-colors"
            >
              <Home size={16} />
              <span>Home</span>
            </Link>

            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-400 text-black font-extrabold text-lg flex items-center justify-center border-2 border-white/20 shadow-md cursor-pointer hover:scale-105 transition-all"
                >
                  {getProfileInitial()}
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full pt-2 w-52 z-50">
                    <div className="bg-[#12100e] border border-white/10 p-2 rounded-2xl shadow-2xl flex flex-col gap-1">
                      <button 
                        onClick={() => navigate('/Dashboard')}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/5 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <Settings size={14} className="text-yellow-500" /> Account Settings
                      </button>
                      <button 
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl border-t border-white/5 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onOpenAuthModal}
                className="bg-gradient-to-r from-yellow-500 to-amber-400 text-black px-5 py-2.5 rounded-xl font-extrabold text-xs tracking-wide flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition-all"
              >
                <UserCheck size={16} /> Login / Register
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2.5">
            {user && (
              <button 
                onClick={() => navigate('/Dashboard')}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-400 text-black font-extrabold text-sm flex items-center justify-center border border-white/20 shadow-sm"
              >
                {getProfileInitial()}
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-300 hover:text-white cursor-pointer active:scale-95 transition-transform"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>
      </header>

      {/* --- MOBILE DRAWER MENU --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-[#0e0c0b]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 flex flex-col gap-4 z-40 shadow-2xl overflow-hidden"
          >
            <Link
              to="/"
              className="flex items-center gap-3 text-sm font-bold text-stone-200 py-3 border-b border-white/5 hover:text-yellow-400 transition-colors"
            >
              <Home size={18} className="text-yellow-500" /> Home Dashboard
            </Link>

            {user ? (
              <>
                <Link
                  to="/Dashboard"
                  className="flex items-center gap-3 text-sm font-bold text-stone-200 py-3 border-b border-white/5 hover:text-yellow-400 transition-colors"
                >
                  <Settings size={18} className="text-yellow-500" /> Account Settings
                </Link>

                {isAdmin && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/request-ticket`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        const data = await res.json();
                        if (res.ok && data.success && data.ticket) {
                          sessionStorage.setItem('admin_login_ticket', data.ticket);
                          navigate('/admin/login');
                        }
                      } catch {}
                    }}
                    className="flex items-center gap-3 text-sm font-bold text-yellow-400 py-3 border-b border-white/5 text-left hover:text-yellow-300 transition-colors"
                  >
                    <ShieldAlert size={18} /> Admin Command Center
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="flex items-center gap-3 text-sm font-bold text-red-400 py-3 text-left hover:text-red-300 transition-colors cursor-pointer"
                >
                  <LogOut size={18} /> Log Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-400 text-black py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 mt-2 shadow-lg cursor-pointer active:scale-95 transition-transform"
              >
                <UserCheck size={18} /> Login / Register
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN PAGE CONTENT WRAPPER --- */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col">
        {children}
      </main>

      {/* --- FOOTER --- */}
      <footer className="w-full py-6 border-t border-white/5 text-center text-stone-500 text-xs font-medium px-4">
        © {new Date().getFullYear()} JB Logistics Services. All rights reserved.
      </footer>
    </div>
  );
}