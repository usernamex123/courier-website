import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { UserCheck, X, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
  return `${protocol}//${hostname}:5000`;
};

const API_URL = getApiUrl();

export default function Login() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Clear stale local tokens on load without firing global destructive backend requests
  useEffect(() => {
    try {
      localStorage.removeItem('driver_token');
    } catch (err) {
      // Silent catch for storage errors
    }
  }, []);

  const toggleModal = (open) => {
    if (open) {
      setShouldRender(true);
      setTimeout(() => setIsModalOpen(true), 10);
    } else {
      setIsModalOpen(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  };

  useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.scrollbarGutter = 'stable';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.scrollbarGutter = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.scrollbarGutter = 'auto';
    };
  }, [shouldRender]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // --- CLIENT REGISTRATION VIA SUPABASE ---
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() }
          }
        });
        if (error) throw error;
        toast.success('Registration successful!');
        setIsSignUp(false);
        setLoading(false);
        return;
      }

      const cleanEmail = email.trim();

      // 1. Try Admin Login First
      try {
        const adminRes = await fetch(`${API_URL}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
          credentials: 'include'
        });

        const adminData = await adminRes.json().catch(() => ({}));

        if (adminRes.ok && adminData.success) {
          toast.success('Admin authenticated successfully!');
          toggleModal(false);
          navigate('/admin/dashboard');
          return;
        }

        if (adminRes.status >= 500) {
          throw new Error(adminData.error || 'Server error during admin authentication.');
        }
      } catch (adminErr) {
        if (adminErr.message && adminErr.message.includes('Server error')) {
          throw adminErr;
        }
        // Silent fallback for non-admin accounts
      }

      // 2. Try Driver Login via Express Backend Route (Removed 2-second timeout restriction to prevent premature aborts)
      try {
        const driverRes = await fetch(`${API_URL}/api/driver/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
          credentials: 'include'
        });

        const driverData = await driverRes.json().catch(() => ({}));

        if (driverRes.ok && driverData.success) {
          localStorage.setItem('driver_data', JSON.stringify(driverData.driver));
          toast.success('Welcome back, driver!');
          toggleModal(false);
          navigate('/driver-portal');
          return;
        }

        if (driverRes.status >= 500) {
          throw new Error(driverData.error || 'Server error during driver authentication.');
        }
      } catch (driverErr) {
        if (driverErr.message && driverErr.message.includes('Server error')) {
          throw driverErr;
        }
        // Silent fallback for regular client accounts
      }

      // 3. Fallback to Standard Client Portal (Supabase Auth directly)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (authError) {
        throw new Error(authError.message || 'Invalid email or password.');
      }

      toast.success('Welcome back!');
      toggleModal(false);
      navigate('/Dashboard');

    } catch (err) {
      console.error('Auth error:', err);
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Navbar Button */}
      <button
        onClick={() => toggleModal(true)}
        className="bg-black hover:bg-yellow-600 border-2 border-yellow-500 text-white hover:text-black active:scale-95 px-5 lg:px-6 py-3 rounded-none font-black text-xs lg:text-sm uppercase tracking-wider inline-flex items-center gap-2 text-center transition-all duration-300 shrink-0 ml-2 cursor-pointer shadow-lg group"
      >
        <UserCheck size={16} className="text-yellow-500 group-hover:text-black transition-colors duration-300" />
        <span>Login/Register</span>
      </button>

      {/* Modal Popup rendered via Portal to escape Navbar stacking context/transforms */}
      {typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <AnimatePresence>
            {shouldRender && (
              <div className="fixed inset-0 z-[99999] flex items-start justify-center p-4 sm:p-6 py-12 sm:py-16 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isModalOpen ? 1 : 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => toggleModal(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: isModalOpen ? 1 : 0, scale: isModalOpen ? 1 : 0.95, y: isModalOpen ? 0 : 20 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="w-full max-w-md bg-[#0d0c0b] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-yellow-500/5 relative text-white z-10 my-auto"
                >
                  <button
                    onClick={() => toggleModal(false)}
                    className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>

                  <div className="text-center space-y-1 mb-8">
                    <h2 className="text-3xl font-black tracking-tight text-white">
                      {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-sm text-white/50">
                      {isSignUp ? 'Register to manage your shipments' : 'Sign in to access your client account'}
                    </p>
                  </div>

                  <div className="flex bg-[#050505] p-1.5 rounded-2xl border border-white/10 mb-6">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        !isSignUp ? 'bg-yellow-500 text-black shadow-md' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        isSignUp ? 'bg-yellow-500 text-black shadow-md' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Register
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/75">
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required={isSignUp}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full bg-[#050505] border border-white/15 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-500 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/75">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full bg-[#050505] border border-white/15 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/75">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full bg-[#050505] border border-white/15 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-500 transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-extrabold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Please wait...</span>
                        </>
                      ) : (
                        <>
                          <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}