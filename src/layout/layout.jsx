import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ArrowUp, Home, UserCheck, CheckCircle2, Eye, EyeOff, Menu, X } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabase";

const InputField = ({ label, placeholder, type, value, onChange, error, autoComplete, name, showPasswordToggle, showPassword, onTogglePassword }) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      <label className="text-sm font-bold uppercase tracking-wider text-white">
        {label}
      </label>
      <div className={`relative border ${error ? 'border-red-500' : 'border-white'} bg-[#1c1917] p-3 shadow-[0_0_4px_rgba(255,255,255,0.2)] transition-all flex items-center`}>
        <input
          type={type}
          name={name}
          placeholder={isFocused ? "" : placeholder}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-white outline-none placeholder-white/70 text-sm"
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="text-white/70 hover:text-white focus:outline-none ml-2 cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default function Layout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // --- USER SESSION STATE ---
  const [user, setUser] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const lastScrollY = useRef(0);
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isSubPage = location.pathname !== "/" && location.pathname !== "";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    setIsOpen(false);
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    toggleModal(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsOpen(false);
      setIsProfileMenuOpen(false);

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

    if (id === 'about-us' || id === 'contact-us') {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    let serviceKey = 'ocean';
    if (id === 'ground-freight') serviceKey = 'ground';
    else if (id === 'air-freight') serviceKey = 'air';
    else if (id === 'warehousing') serviceKey = 'warehousing';
    else if (id === 'sea-freight') serviceKey = 'ocean';

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('change-service-tab', { detail: serviceKey }));
      }, 100);
    } else {
      window.dispatchEvent(new CustomEvent('change-service-tab', { detail: serviceKey }));
    }
  };

  const toggleModal = (open, mode = false) => {
    if (open) {
      setIsSignUp(mode);
      setShouldRender(true);
      setErrors({});
      setSuccessMessage(null);
      setFormData({ name: '', email: '', password: '' });
      setShowPassword(false);
      setTimeout(() => setIsModalOpen(true), 10);
    } else {
      setIsModalOpen(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  };

  const isWeakPassword = (password) => {
    if (!password || password.length < 6) return true;
    const isAllSame = /^(.)\1+$/.test(password);
    const sequences = ["123456", "234567", "345678", "456789", "abcdef", "qwerty"];
    const isSequential = sequences.some(seq => password.toLowerCase().includes(seq));
    return isAllSame || isSequential;
  };

  const validate = () => {
    let newErrors = {};
    if (isSignUp && (!formData.name || formData.name.trim() === "")) {
      newErrors.name = "Name is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (isWeakPassword(formData.password)) {
      newErrors.password = "Password is weak. Avoid repeating characters or simple sequences.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setErrors({});

      try {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: { data: { full_name: formData.name } }
          });
          if (error) throw error;
          setSuccessMessage("Account created & logged in!");
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          if (error) throw error;
          setSuccessMessage("Logged in successfully!");
        }

        setFormData({ name: '', email: '', password: '' });
        setTimeout(() => toggleModal(false), 1500);
      } catch (error) {
        setErrors({ email: error.message });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const HeaderContent = ({ height }) => (
    <div className={`max-w-7xl mx-auto px-4 sm:px-5 flex justify-between items-center w-full ${height}`}>
      {/* Brand Logo */}
      <Link to="/" className="flex flex-col items-center font-brand ml-1 group">
        <div className="flex items-center text-xl sm:text-3xl font-black tracking-tight leading-none text-white">
          <span className="text-yellow-500">J</span>
          <span className="text-yellow-500">B</span>
          <span className="text-white ml-1.5 sm:ml-2">LOGISTICS</span>
        </div>
        <div className="w-full h-[2px] sm:h-[2.5px] bg-yellow-500 my-0.5 rounded-full"></div>
        <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-stone-300 leading-none">
          Services
        </div>
      </Link>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6 lg:gap-8">
        {isSubPage && (
          <Link
            to="/"
            className="group flex items-center gap-1.5 text-sm md:text-base font-black uppercase tracking-wider text-white hover:text-yellow-500 transition-colors duration-300"
          >
            <Home size={16} className="text-white group-hover:text-yellow-500 transition-colors duration-300" />
            <span>Home</span>
          </Link>
        )}

        <div
          className="relative h-[60px] flex items-center justify-center"
          onMouseLeave={() => setIsOpen(false)}
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={() => setIsOpen(true)}
            className="flex items-center gap-1 text-sm md:text-base font-black uppercase tracking-wider text-white hover:text-yellow-500 cursor-pointer h-full"
          >
            Services <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
          </button>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-[60px] left-0 w-64 z-[100]"
              >
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

        <a href="#about-us" onClick={(e) => handleHomeScroll(e, 'about-us')} className="text-sm md:text-base font-black uppercase tracking-wider text-white hover:text-yellow-500 cursor-pointer">About Us</a>
        <a href="#contact-us" onClick={(e) => handleHomeScroll(e, 'contact-us')} className="text-sm md:text-base font-black uppercase tracking-wider text-white hover:text-yellow-500 cursor-pointer">Contact Us</a>

        {user ? (
          <div ref={profileMenuRef} className="flex items-center gap-4 ml-2 relative">
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-yellow-500 text-black font-black text-base lg:text-lg flex items-center justify-center uppercase tracking-wider border-2 border-white shadow-lg cursor-pointer select-none hover:bg-yellow-400 transition-colors"
                title={user.user_metadata?.full_name || user.email}
              >
                {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0) : user.email.charAt(0)}
              </button>
              
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full pt-3 w-56 z-50"
                  >
                    <div className="bg-[#141210] border border-white/10 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 backdrop-blur-xl">
                      <button onClick={() => { setIsProfileMenuOpen(false); navigate('/profile'); }} className="w-full text-left px-4 py-3 text-xs font-extrabold tracking-wider text-white hover:bg-white/5 hover:text-yellow-500 transition-colors cursor-pointer rounded-xl uppercase">Profile</button>
                      <button onClick={() => { setIsProfileMenuOpen(false); navigate('/settings'); }} className="w-full text-left px-4 py-3 text-xs font-extrabold tracking-wider text-white hover:bg-white/5 hover:text-yellow-500 transition-colors cursor-pointer rounded-xl uppercase">Settings</button>
                      <div className="h-[1px] bg-white/10 my-1"></div>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-xs font-extrabold tracking-wider text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer rounded-xl uppercase">Logout</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => toggleModal(true, false)}
            className="bg-black hover:bg-yellow-600 border-2 border-yellow-500 text-white hover:text-black active:scale-95 px-5 lg:px-6 py-3 rounded-none font-black text-xs lg:text-sm uppercase tracking-wider inline-flex items-center gap-2 text-center transition-all duration-300 shrink-0 ml-2 cursor-pointer shadow-lg group"
          >
            <UserCheck size={16} className="text-yellow-500 group-hover:text-black transition-colors duration-300" />
            <span>Login/Register</span>
          </button>
        )}
      </div>

      {/* Mobile Menu & Profile Toggle Button */}
      <div className="flex md:hidden items-center gap-3">
        {user && (
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-10 h-10 rounded-full bg-yellow-500 text-black font-black text-sm flex items-center justify-center uppercase border border-white shadow"
          >
            {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0) : user.email.charAt(0)}
          </button>
        )}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`relative min-h-screen w-full text-white overflow-x-hidden ${shouldRender ? 'overflow-hidden h-screen' : ''}`}>
      <nav className="w-full absolute top-0 z-50 py-4 sm:py-6">
        <HeaderContent height="h-[50px] sm:h-[60px]" />
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-[74px] left-0 w-full bg-[#0d0b0a]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 flex flex-col gap-4 z-40 shadow-2xl max-h-[calc(100vh-74px)] overflow-y-auto"
          >
            {isSubPage && (
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white py-3 border-b border-white/10"
              >
                <Home size={18} className="text-yellow-500" /> Home
              </Link>
            )}

            <div>
              <button
                onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                className="w-full flex items-center justify-between text-sm font-black uppercase tracking-wider text-white py-3 border-b border-white/10"
              >
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

            <a href="#about-us" onClick={(e) => handleHomeScroll(e, 'about-us')} className="text-sm font-black uppercase tracking-wider text-white py-3 border-b border-white/10">About Us</a>
            <a href="#contact-us" onClick={(e) => handleHomeScroll(e, 'contact-us')} className="text-sm font-black uppercase tracking-wider text-white py-3 border-b border-white/10">Contact Us</a>

            {user ? (
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }} className="w-full text-left py-3 text-xs font-bold tracking-wider text-white uppercase border-b border-white/5">Profile Settings</button>
                <button onClick={() => { setIsMobileMenuOpen(false); navigate('/settings'); }} className="w-full text-left py-3 text-xs font-bold tracking-wider text-white uppercase border-b border-white/5">Preferences & Settings</button>
                <button onClick={handleLogout} className="w-full text-left py-3 text-xs font-bold tracking-wider text-red-500 uppercase">Log Out</button>
              </div>
            ) : (
              <button 
                onClick={() => { setIsMobileMenuOpen(false); toggleModal(true, false); }}
                className="w-full bg-yellow-500 text-black py-3.5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 mt-4 shadow-lg"
              >
                <UserCheck size={16} /> Login / Register
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -150, opacity: 0, transition: { duration: 0 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 w-full z-40 bg-white/5 backdrop-blur-xl border-b border-white/10 h-[74px] sm:h-[93px] flex items-center shadow-sm"
          >
            <HeaderContent height="h-[74px] sm:h-[93px]" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <main>
        <Outlet />
      </main>

      {shouldRender && (
        <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-start overflow-y-auto pt-20 sm:pt-24 p-4 sm:p-6 bg-[#1c1917] transition-opacity duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={() => toggleModal(false)} 
            className="absolute top-4 right-6 sm:top-6 sm:right-10 text-3xl sm:text-4xl text-white hover:text-yellow-600 transition-colors cursor-pointer"
          >
            ✕
          </button>
          
          <div className="w-full max-w-md text-center pb-20 relative">
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  className="absolute inset-x-0 top-0 z-30 bg-black/95 border-2 border-yellow-500 p-6 sm:p-8 shadow-[0_0_30px_rgba(234,179,8,0.3)] flex flex-col items-center justify-center gap-4 backdrop-blur-md"
                >
                  <CheckCircle2 size={50} className="text-yellow-500 animate-bounce" />
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                    {successMessage}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-300">
                    Redirecting you to your dashboard...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-wider text-white mb-2">
                {isSignUp ? "Create Account" : "Welcome Back!"}
              </h2>
              <p className="text-white/60 text-xs sm:text-sm">
                {isSignUp ? "Please fill in your details to sign up" : "Please enter login details below"}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 sm:gap-5" noValidate>
              {isSignUp && (
                <InputField 
                  label="Full Name"
                  name="name"
                  placeholder="Enter your full name" 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  error={errors.name}
                  autoComplete="name"
                />
              )}

              <InputField 
                label="Email"
                name="email"
                placeholder="Enter the email" 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                error={errors.email}
                autoComplete="email"
              />

              <div className="flex flex-col gap-1 w-full">
                <InputField 
                  label="Password"
                  name="password"
                  placeholder="Enter the Password" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  error={errors.password}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  showPasswordToggle={true}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
                {!isSignUp && (
                  <div className="text-right mt-1">
                    <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Forgot password clicked"); }} className="text-xs text-white/70 hover:text-yellow-600 transition-colors">
                      Forgot password?
                    </a>
                  </div>
                )}
              </div>

              {errors.email && !isSignUp && (
                <span className="text-red-500 text-xs text-left">{errors.email}</span>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-yellow-500 hover:bg-yellow-600 text-black transition-all py-3.5 sm:py-4 font-black uppercase tracking-[0.2em] mt-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm shadow-md"
              >
                {isSubmitting ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Sign Up" : "Sign in")}
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative bg-[#1c1917] px-4 text-xs uppercase tracking-wider text-white/50">
                  Or continue
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => alert("Google login clicked")}
                className="border border-white hover:bg-white/5 transition-all text-white py-3.5 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 cursor-pointer"
              >
                <span className="font-bold text-base text-red-500">G</span> Continue with Google
              </button>

              <div className="text-center mt-6 text-xs sm:text-sm text-white/70">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrors({});
                    setFormData({ name: '', email: '', password: '' });
                    setShowPassword(false);
                  }} 
                  className="text-yellow-600 font-bold hover:underline cursor-pointer ml-1"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[100] bg-yellow-600 p-2.5 sm:p-3 shadow-lg hover:bg-yellow-700 transition-all duration-300 text-white cursor-pointer"
          >
            <ArrowUp size={20} className="sm:w-6 sm:h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}