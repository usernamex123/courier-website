import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight, ArrowLeft, Loader2, ShieldCheck, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
  return `${protocol}//${hostname}:5000`;
};

const API_URL = getApiUrl();

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

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
          }
        }
      } catch (err) {
        console.error('Admin session check error:', err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkAdminSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        toast.success('Welcome back, Admin!');
        setIsAdminAuth(true);
        navigate('/admin/dashboard', { replace: true });
      } else {
        toast.error(data.error || data.message || 'Invalid admin credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Unable to connect to login service');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setIsAdminAuth(false);
      toast.success('Admin session terminated');
    } catch (err) {
      console.error('Server logout error:', err);
      toast.error('Logout failed');
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-md bg-[#0d0c0b] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-yellow-500/5 relative">
        
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Shield className="w-7 h-7 text-yellow-500" />
          </div>
        </div>

        {isAdminAuth ? (
          <div className="text-center space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-tight text-white">
                Admin Session Active
              </h1>
              <p className="text-sm text-white/50">
                You are currently logged in with administrative privileges.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-full bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-extrabold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Go to Admin Dashboard</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full bg-white/5 hover:bg-white/10 text-red-400 font-bold text-sm py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Admin</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1 mb-8">
              <h1 className="text-3xl font-black tracking-tight text-white">
                Admin Portal
              </h1>
              <p className="text-sm text-white/50">
                Please enter admin credentials below
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70">
                  ADMIN EMAIL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email"
                    className="w-full bg-[#050505] border border-white/15 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70">
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full bg-[#050505] border border-white/15 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-extrabold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Website</span>
          </Link>
        </div>

      </div>
    </div>
  );
}