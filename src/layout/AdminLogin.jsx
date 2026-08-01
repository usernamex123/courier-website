import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion } from "framer-motion";
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingTicket, setIsVerifyingTicket] = useState(true);
  const [isValidTicket, setIsValidTicket] = useState(false); // Prevention guard state
  const navigate = useNavigate();

  // Verify temporary security ticket on component mount
  useEffect(() => {
    const verifyTicket = async () => {
      const ticket = sessionStorage.getItem('admin_login_ticket');
      
      if (!ticket) {
        setIsVerifyingTicket(false);
        setIsValidTicket(false);
        setError('Unauthorized access: No security clearance ticket found. Please use the profile link.');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/admin/verify-ticket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket })
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setIsValidTicket(true); // Ticket is valid, allow login form
        } else {
          setIsValidTicket(false);
          setError('Security ticket has expired or is invalid. Return to profile to try again.');
        }
      } catch (err) {
        console.error('Ticket verification network error:', err);
        setIsValidTicket(false);
        setError('Network error validating security ticket.');
      } finally {
        setIsVerifyingTicket(false);
        // Clear ticket immediately so it can never be reused
        sessionStorage.removeItem('admin_login_ticket');
      }
    };

    verifyTicket();
  }, []);

  const handleDirectLogin = async () => {
    setError('');

    if (!password.trim()) {
      setError('Please enter the admin passcode.');
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending login request to:", `${API_URL}/api/admin/login`);
      
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      console.log("Server Response:", data);

      if (response.ok && data.success) {
        const tokenToSave = data.token || data.accessToken || data.access_token;
        
        if (tokenToSave) {
          localStorage.setItem('admin_token', tokenToSave);
          toast.success('Successfully authenticated');
          navigate('/admin/dashboard', { replace: true });
        } else {
          setError('Server authenticated successfully, but no token was returned.');
          setIsLoading(false);
        }
      } else {
        setError(data.message || 'Invalid passcode. Access denied.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login connection error:', err);
      setError('Server connection failed. Ensure backend is running.');
      setIsLoading(false);
    }
  };

  if (isVerifyingTicket) {
    return (
      <div className="min-h-screen bg-[#070605] flex items-center justify-center text-white font-['Inter',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-yellow-500" />
          <span className="text-sm font-bold text-stone-400">Inspecting security clearance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full text-white bg-[#070605] flex items-center justify-center px-6 font-['Inter',sans-serif] selection:bg-yellow-500 selection:text-black">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[500px] bg-gradient-to-b from-yellow-500/10 via-amber-500/0 to-transparent blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#12100e] border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl z-10 overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-4 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Admin Verification
          </h1>
          <p className="text-xs md:text-sm font-semibold text-stone-400 mt-2">
            Enter your secure admin passcode to proceed to the dashboard.
          </p>
        </div>

        {/* Prevent rendering the login form unless isValidTicket is explicitly true */}
        {!isValidTicket ? (
          <div className="p-4 mb-6 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error || 'Unauthorized access detected.'}</span>
            </div>
            <button 
              type="button"
              onClick={() => navigate('/')} 
              className="mt-2 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-white rounded-xl font-extrabold uppercase tracking-wider text-[11px] transition-colors cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {error && (
              <div className="p-3 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex flex-col gap-2 w-full text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Admin Passcode
              </label>
              <div className="relative border border-white/10 bg-[#141210]/90 px-5 py-4 transition-all duration-300 rounded-2xl flex items-center focus-within:border-yellow-500 focus-within:shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                <Lock size={18} className="text-stone-500 mr-3 shrink-0" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDirectLogin(); }}
                  autoComplete="current-password"
                  className="w-full bg-transparent text-white outline-none placeholder-stone-600 text-base font-medium tracking-normal"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleDirectLogin}
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-black py-4 rounded-2xl font-extrabold text-base tracking-wide transition-all duration-300 cursor-pointer shadow-[0_0_25px_rgba(234,179,8,0.25)] flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying Access...</span>
                </>
              ) : (
                <>
                  <span>Continue to Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-bold text-stone-500 hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Public Website
          </button>
        </div>
      </motion.div>
    </div>
  );
}