import UserFeatures from './userfeatures';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, UserCheck, CheckCircle2, ShieldCheck, 
  Truck, ArrowUp, Key, Plus, AlertTriangle, FileText, Package, X, Loader2, LogOut, Settings, CheckCircle, Eye, EyeOff, ShieldAlert, Users, Database, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase correctly using Vite environment variables
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const InputField = ({ label, placeholder, type, value, onChange, error, autoComplete, name }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-2 w-full text-left font-['Inter',sans-serif]">
      <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
        {label}
      </label>
      <div className={`relative border ${error ? 'border-red-500' : isFocused ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'border-white/10'} bg-[#141210]/90 px-5 py-4 transition-all duration-300 rounded-2xl flex items-center`}>
        <input
          type={inputType}
          name={name}
          placeholder={isFocused ? "" : placeholder}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-white outline-none placeholder-stone-600 text-base font-medium tracking-normal pr-8"
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-stone-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="text-red-400 text-xs font-semibold">{error}</span>}
    </div>
  );
};

export default function User() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // --- APP TOAST NOTIFICATION STATE ---
  const [toastMessage, setToastMessage] = useState(null);

  // --- USER SESSION & PROFILE STATE ---
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // --- DELETE ACCOUNT CONFIRMATION MODAL STATE ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [shouldRenderDelete, setShouldRenderDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- CHANGE PASSWORD MODAL STATE ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [shouldRenderPassword, setShouldRenderPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  // --- ADD PHONE NUMBER MODAL STATE ---
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [shouldRenderPhone, setShouldRenderPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState({ text: '', type: '' });

  // --- ACTIVE OVERLAY BANNER STATE & DATA ---
  const [activeTab, setActiveTab] = useState(null); // 'quotes' or 'shipments'
  const [userQuotes, setUserQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  const lastScrollY = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        extractProfileFromUser(currentUser);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        extractProfileFromUser(currentUser);
      } else {
        setProfileData({ name: '', email: '', phone: '' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- FETCH USER QUOTES FROM SUPABASE FILTERED BY AUTH USER ID & GMAIL/EMAIL MATCH ---
  useEffect(() => {
    const fetchUserQuotes = async () => {
      if (activeTab === 'quotes') {
        const userEmail = user?.email || profileData.email;
        const userId = user?.id;

        if (!userEmail && !userId) {
          setUserQuotes([]);
          return;
        }

        setQuotesLoading(true);
        try {
          let query = supabase.from('messages').select('*');
          
          if (userId && userEmail) {
            query = query.or(`user_id.eq.${userId},email.ilike.${userEmail}`);
          } else if (userId) {
            query = query.eq('user_id', userId);
          } else if (userEmail) {
            query = query.ilike('email', userEmail);
          }

          const { data, error } = await query.order('created_at', { ascending: false });

          if (error) {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('messages')
              .select('*')
              .eq('email', userEmail)
              .order('created_at', { ascending: false });

            if (fallbackError) {
              setUserQuotes([]);
            } else {
              setUserQuotes(fallbackData || []);
            }
          } else {
            setUserQuotes(data || []);
          }
        } catch (err) {
          console.error("Error fetching quotes:", err);
          setUserQuotes([]);
        } finally {
          setQuotesLoading(false);
        }
      }
    };

    fetchUserQuotes();
  }, [activeTab, user, profileData.email]);

  const extractProfileFromUser = (currentUser) => {
    setProfileData({
      name: currentUser.user_metadata?.full_name || '',
      email: currentUser.email || '',
      phone: currentUser.user_metadata?.phone || ''
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfileData({ name: '', email: '', phone: '' });
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  const toggleDeleteModal = (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setDeletePassword('');
      setDeleteError('');
      setShouldRenderDelete(true);
      requestAnimationFrame(() => setIsDeleteModalOpen(true));
    } else {
      setIsDeleteModalOpen(false);
      setTimeout(() => {
        setShouldRenderDelete(false);
        document.body.style.overflow = '';
      }, 300);
    }
  };

  // --- FULL ACCOUNT DELETION FROM AUTH & DATABASE WITH CURRENT PASSWORD CHECK ---
  const executeDeleteAccount = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    if (!deletePassword) {
      setDeleteError("Please enter your current password to confirm deletion.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      const userEmail = user?.email || profileData.email;
      
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: deletePassword,
      });

      if (verifyError) {
        throw new Error("Incorrect current password. Unable to delete account.");
      }

      const { error: rpcError } = await supabase.rpc('delete_user_account');
      
      if (rpcError) {
        console.error("RPC delete_user_account failed:", rpcError.message);
        throw new Error(rpcError.message || "Failed to delete account auth record.");
      }

      await supabase.auth.signOut();
      setUser(null);
      setProfileData({ name: '', email: '', phone: '' });
      setIsProfileMenuOpen(false);
      toggleDeleteModal(false);
      showToast("Account has been completely deleted.");
      navigate('/');
    } catch (err) {
      console.error("Error during account deletion:", err);
      setDeleteError(err.message || "Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- SECURE HANDLE PASSWORD UPDATE ---
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage({ text: 'All password fields are required.', type: 'error' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordMessage({ text: 'New password cannot be the same as current password.', type: 'error' });
      return;
    }

    setPasswordLoading(true);

    try {
      const userEmail = user?.email || profileData.email;
      if (!userEmail) throw new Error("No active user session email found.");

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: passwordForm.currentPassword,
      });

      if (verifyError) {
        throw new Error('Incorrect current password.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) throw updateError;

      setPasswordMessage({ text: 'Password updated successfully!', type: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        togglePasswordModal(false);
        setPasswordMessage({ text: '', type: '' });
      }, 1500);
    } catch (error) {
      setPasswordMessage({ text: error.message || 'Failed to update password.', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- HANDLE PHONE NUMBER UPDATE ---
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setPhoneMessage({ text: '', type: '' });

    if (!newPhone || newPhone.trim() === '') {
      setPhoneMessage({ text: 'Please enter a valid phone number.', type: 'error' });
      return;
    }

    setPhoneLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { phone: newPhone.trim() }
      });

      if (error) throw error;

      setUser(data.user);
      setProfileData(prev => ({ ...prev, phone: newPhone.trim() }));
      setPhoneMessage({ text: 'Contact number updated successfully!', type: 'success' });
      setNewPhone('');
      
      setTimeout(() => {
        togglePhoneModal(false);
        setPhoneMessage({ text: '', type: '' });
      }, 1500);
    } catch (error) {
      setPhoneMessage({ text: error.message || 'Failed to update phone number.', type: 'error' });
    } finally {
      setPhoneLoading(false);
    }
  };

  useEffect(() => {
    setIsProfileMenuOpen(false);
    toggleModal(false);
    togglePasswordModal(false);
    togglePhoneModal(false);
    toggleDeleteModal(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
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

  const toggleModal = (open, mode = false) => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setIsSignUp(mode);
      setShouldRender(true);
      setErrors({});
      setFormData({ name: '', email: '', password: '' });
      requestAnimationFrame(() => setIsModalOpen(true));
    } else {
      setIsModalOpen(false);
      setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = '';
      }, 300);
    }
  };

  const togglePasswordModal = (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage({ text: '', type: '' });
      setShouldRenderPassword(true);
      requestAnimationFrame(() => setIsPasswordModalOpen(true));
    } else {
      setIsPasswordModalOpen(false);
      setTimeout(() => {
        setShouldRenderPassword(false);
        document.body.style.overflow = '';
      }, 300);
    }
  };

  const togglePhoneModal = (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setNewPhone(profileData.phone || '');
      setPhoneMessage({ text: '', type: '' });
      setShouldRenderPhone(true);
      requestAnimationFrame(() => setIsPhoneModalOpen(true));
    } else {
      setIsPhoneModalOpen(false);
      setTimeout(() => {
        setShouldRenderPhone(false);
        document.body.style.overflow = '';
      }, 300);
    }
  };

  const isWeakPassword = (password) => {
    if (!password || password.length < 6) return true;
    const isAllSame = /^(.)\1+$/.test(password);
    const sequences = ["123456", "234567", "345678", "456789", "abcdef", "qwerty"];
    const isSequential = sequences.some(seq => password.toLowerCase().includes(seq));
    return isAllSame || isSequential;
  };

  const validateAuth = () => {
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
    if (validateAuth()) {
      setIsSubmitting(true);
      setErrors({});

      try {
        if (isSignUp) {
          const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: { 
              data: { full_name: formData.name } 
            }
          });
          if (error) throw error;

          await supabase.auth.signOut();
          setUser(null);
          setProfileData({ name: '', email: '', phone: '' });

          showToast("Account created successfully! Please login with your credentials.");
          setIsSignUp(false);
          setFormData({ name: '', email: formData.email, password: '' });
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          if (error) throw error;

          const currentUser = data.user;
          setUser(currentUser);
          
          setProfileData({
            name: currentUser?.user_metadata?.full_name || 'Valued Client',
            email: currentUser?.email || formData.email,
            phone: currentUser?.user_metadata?.phone || ''
          });

          showToast("Logged in successfully!");
          setFormData({ name: '', email: '', password: '' });
          setTimeout(() => { toggleModal(false); }, 400);
        }
      } catch (error) {
        setErrors({ email: error.message });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getProfileInitial = () => {
    const fullName = profileData.name || user?.user_metadata?.full_name;
    if (fullName && fullName.trim() !== "") {
      return fullName.trim().charAt(0).toUpperCase();
    }
    if (profileData.email || user?.email) {
      return (profileData.email || user.email).charAt(0).toUpperCase();
    }
    return "G";
  };

  const HeaderContent = ({ height }) => (
    <div className={`max-w-7xl mx-auto px-6 flex justify-between items-center w-full ${height} font-['Inter',sans-serif]`}>
      <Link to="/" className="flex flex-col items-center font-brand ml-2 group">
        <div className="flex items-center text-3xl font-extrabold tracking-tight leading-none text-white">
          <span className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">J</span>
          <span className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">B</span>
          <span className="text-white ml-2">LOGISTICS</span>
        </div>
        <div className="w-full h-[2.5px] bg-gradient-to-r from-yellow-500 to-amber-400 my-1 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
        <div className="text-[10px] font-bold tracking-[0.25em] text-stone-400 leading-none">
          SERVICES
        </div>
      </Link>
      
      <div className="flex items-center gap-6 md:gap-8">
        <Link
          to="/"
          className="group flex items-center gap-2 text-base font-semibold tracking-wide text-stone-300 hover:text-yellow-400 transition-all duration-300"
        >
          <Home size={18} className="text-stone-400 group-hover:text-yellow-400 transition-colors duration-300" />
          <span>Home</span>
        </Link>

        {user ? (
          <div 
            className="flex items-center gap-4 ml-2 relative"
            onMouseLeave={() => setIsProfileMenuOpen(false)}
          >
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-400 text-black font-extrabold text-xl flex items-center justify-center border-2 border-white/20 shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer select-none hover:scale-105 active:scale-95 transition-all"
                title={profileData.name || user.email}
              >
                {getProfileInitial()}
              </button>
              
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full pt-3 w-56 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-[#12100e]/95 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex flex-col gap-1">
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-all cursor-pointer rounded-xl flex items-center gap-2.5"
                    >
                      <Settings size={16} className="text-yellow-500" />
                      <span>Account Settings</span>
                    </button>

                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer rounded-xl border-t border-white/5 mt-0.5 flex items-center gap-2.5"
                    >
                      <LogOut size={16} className="text-red-400" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button 
            onClick={() => toggleModal(true, false)}
            className="bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-black active:scale-95 px-7 py-3.5 rounded-2xl font-extrabold text-base tracking-wide inline-flex items-center gap-2.5 text-center transition-all duration-300 shrink-0 ml-2 cursor-pointer shadow-[0_0_20px_rgba(234,179,8,0.25)] group"
          >
            <UserCheck size={18} className="text-black group-hover:scale-110 transition-transform duration-300" />
            <span>Login / Register</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full text-white bg-[#070605] flex flex-col font-['Inter',sans-serif] selection:bg-yellow-500 selection:text-black">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-yellow-500/5 via-amber-500/0 to-transparent blur-[120px] pointer-events-none"></div>

      {/* --- FLOATING TOAST NOTIFICATION --- */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[400] bg-[#141210]/95 backdrop-blur-2xl border border-yellow-500/30 text-white px-5 py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-3.5 max-w-md"
          >
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
              <CheckCircle size={18} />
            </div>
            <p className="text-sm font-semibold tracking-wide text-stone-200">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="w-full absolute top-0 z-50 py-6">
        <HeaderContent height="h-[60px]" />
      </nav>

      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -150, opacity: 0, transition: { duration: 0 } }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 w-full z-40 bg-[#090807]/90 backdrop-blur-2xl border-b border-white/10 h-[93px] flex items-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          >
            <HeaderContent height="h-[93px]" />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-40 pb-28 px-6 max-w-5xl mx-auto w-full flex flex-col gap-10 z-10">
        
        {/* --- USER PROFILE BANNER --- */}
        <div className="bg-gradient-to-b from-[#141210] to-[#0d0c0a] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col items-center justify-center text-center gap-6 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-yellow-500/10 rounded-full blur-[90px] pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-600/10 rounded-full blur-[90px] pointer-events-none"></div>
          
          <div className="relative">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-500 to-amber-300 rounded-full blur-sm opacity-75"></div>
            <div className="relative w-32 h-32 rounded-full bg-[#12100e] text-yellow-400 font-extrabold text-5xl flex items-center justify-center border-4 border-[#1c1a17] shadow-2xl shrink-0 select-none">
              {getProfileInitial()}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                {profileData.name || user?.user_metadata?.full_name || (user ? "Valued Client" : "Guest Account")}
              </h1>
              {(user?.email === 'admin@jblogisticsservices.com' || profileData.email === 'admin@jblogisticsservices.com') && (
                <span className="px-3 py-1 bg-yellow-500 text-black font-extrabold text-xs rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm md:text-base text-stone-400 font-medium tracking-wide">
              {profileData.email || user?.email || "guest.account@jblogisticsservices.com"}
            </p>
          </div>

          {/* --- ACCESS ADMIN DASHBOARD BUTTON --- */}
          {(user?.email === 'admin@jblogisticsservices.com' || profileData.email === 'admin@jblogisticsservices.com') && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const tempKey = 'jb_admin_' + Math.random().toString(36).substring(2) + '_' + Date.now();
                sessionStorage.setItem('jb_admin_temp_key', tempKey);
                navigate('/admin/login');
              }}
              className="mt-2 bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-black px-8 py-4 rounded-2xl font-extrabold text-base tracking-wide flex items-center gap-3 cursor-pointer shadow-[0_0_25px_rgba(234,179,8,0.3)] transition-all z-10"
            >
              <ShieldAlert size={20} className="text-black" />
              <span>Access Admin Dashboard</span>
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          <div className="flex flex-col">
            <div className="bg-gradient-to-b from-[#141210] to-[#0d0c0a] border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between shadow-2xl h-full backdrop-blur-md">
              <div className="flex flex-col gap-6">
                <span className="text-sm font-extrabold tracking-[0.2em] text-yellow-400 uppercase">Account Settings</span>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col py-3.5 border-b border-white/5 gap-1.5">
                    <span className="text-[11px] font-bold text-stone-400 tracking-wider uppercase">Full Name</span>
                    <span className="text-base font-bold text-white tracking-normal break-all">
                      {profileData.name || user?.user_metadata?.full_name || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex flex-col py-3.5 border-b border-white/5 gap-1.5">
                    <span className="text-[11px] font-bold text-stone-400 tracking-wider uppercase">Email Address</span>
                    <span className="text-base font-bold text-white tracking-normal break-all">
                      {profileData.email || user?.email || "Not Provided"}
                    </span>
                  </div>

                  {user && (
                    <div className="py-2 border-b border-white/5">
                      <button
                        onClick={() => togglePasswordModal(true)}
                        className="group flex items-center justify-between text-stone-300 hover:text-yellow-400 transition-colors cursor-pointer text-left w-full py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white/5 group-hover:bg-yellow-500/10 transition-colors">
                            <Key size={16} className="text-stone-400 group-hover:text-yellow-400 transition-colors shrink-0" />
                          </div>
                          <span className="text-sm font-bold tracking-wide">Change password</span>
                        </div>
                        <span className="text-xs text-stone-500 group-hover:text-yellow-400 transition-colors">Update</span>
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col py-3.5 gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-400 tracking-wider uppercase">Contact Number</span>
                      {user && (
                        <button
                          onClick={() => togglePhoneModal(true)}
                          className="group flex items-center gap-1.5 text-yellow-400 hover:text-black text-xs font-extrabold tracking-wide transition-all cursor-pointer py-1.5 px-3 bg-yellow-500/10 hover:bg-yellow-400 rounded-xl border border-yellow-500/20"
                        >
                          <Plus size={13} />
                          <span>{profileData.phone ? "Edit" : "Add"}</span>
                        </button>
                      )}
                    </div>
                    <span className="text-base font-bold text-white tracking-normal">
                      {profileData.phone || user?.user_metadata?.phone || user?.phone || "Not Added"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10">
                <button 
                  onClick={() => toggleDeleteModal(true)}
                  className="w-full bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 py-3.5 px-5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer shadow-lg active:scale-95"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col relative h-full">
            <UserFeatures onOpenTab={(cardId) => setActiveTab(cardId)} />
          </div>

        </div>
      </main>

      {/* --- AUTH MODAL --- */}
      <AnimatePresence>
        {shouldRender && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isModalOpen ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => toggleModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: isModalOpen ? 1 : 0, scale: isModalOpen ? 1 : 0.95, y: isModalOpen ? 0 : 20 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-[#12100e] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl z-10 overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">
                    {isSignUp ? "Create Account" : "Welcome Back"}
                  </h3>
                  <p className="text-xs font-semibold text-stone-400 mt-1">
                    {isSignUp ? "Enter your details to sign up" : "Sign in to manage your shipments & profile"}
                  </p>
                </div>
                <button
                  onClick={() => toggleModal(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5">
                {isSignUp && (
                  <InputField
                    label="Full Name"
                    placeholder="John Doe"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={errors.name}
                    autoComplete="name"
                  />
                )}

                <InputField
                  label="Email Address"
                  placeholder="name@example.com"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  autoComplete="email"
                />

                <InputField
                  label="Password"
                  placeholder="••••••••"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-black py-4 rounded-2xl font-extrabold text-base tracking-wide transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(234,179,8,0.25)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Please wait...</span>
                    </>
                  ) : (
                    <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrors({});
                  }}
                  className="text-xs font-bold text-stone-400 hover:text-yellow-400 transition-colors cursor-pointer"
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CHANGE PASSWORD MODAL --- */}
      <AnimatePresence>
        {shouldRenderPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isPasswordModalOpen ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => togglePasswordModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: isPasswordModalOpen ? 1 : 0, scale: isPasswordModalOpen ? 1 : 0.95, y: isPasswordModalOpen ? 0 : 20 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-[#12100e] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Change Password</h3>
                <button
                  onClick={() => togglePasswordModal(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {passwordMessage.text && (
                <div className={`p-3.5 mb-5 rounded-xl text-xs font-semibold ${passwordMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={handlePasswordChangeSubmit} className="flex flex-col gap-4">
                <InputField
                  label="Current Password"
                  placeholder="••••••••"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  autoComplete="current-password"
                />
                <InputField
                  label="New Password"
                  placeholder="••••••••"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  autoComplete="new-password"
                />
                <InputField
                  label="Confirm New Password"
                  placeholder="••••••••"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-black py-4 rounded-2xl font-extrabold text-base tracking-wide transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(234,179,8,0.25)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD / EDIT PHONE NUMBER MODAL --- */}
      <AnimatePresence>
        {shouldRenderPhone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isPhoneModalOpen ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => togglePhoneModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: isPhoneModalOpen ? 1 : 0, scale: isPhoneModalOpen ? 1 : 0.95, y: isPhoneModalOpen ? 0 : 20 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-[#12100e] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Contact Number</h3>
                <button
                  onClick={() => togglePhoneModal(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {phoneMessage.text && (
                <div className={`p-3.5 mb-5 rounded-xl text-xs font-semibold ${phoneMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {phoneMessage.text}
                </div>
              )}

              <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
                <InputField
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  autoComplete="tel"
                />

                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-black py-4 rounded-2xl font-extrabold text-base tracking-wide transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(234,179,8,0.25)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {phoneLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Phone Number</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DELETE ACCOUNT CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {shouldRenderDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isDeleteModalOpen ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => toggleDeleteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: isDeleteModalOpen ? 1 : 0, scale: isDeleteModalOpen ? 1 : 0.95, y: isDeleteModalOpen ? 0 : 20 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-[#12100e] border border-red-500/30 rounded-[2.5rem] p-8 shadow-2xl z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">Delete Account</h3>
                </div>
                <button
                  onClick={() => toggleDeleteModal(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-stone-300 mb-6 leading-relaxed">
                This action is permanent and cannot be undone. All your data, profile details, and history will be permanently deleted from our servers. Please enter your current password to confirm.
              </p>

              {deleteError && (
                <div className="p-3.5 mb-5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                  {deleteError}
                </div>
              )}

              <form onSubmit={executeDeleteAccount} className="flex flex-col gap-4">
                <InputField
                  label="Current Password"
                  placeholder="••••••••"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="current-password"
                />

                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => toggleDeleteModal(false)}
                    className="w-1/2 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold text-sm tracking-wide transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading}
                    className="w-1/2 bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-extrabold text-base tracking-wide transition-all cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <span>Delete Account</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ACTIVE TAB OVERLAY BANNER (QUOTES OR SHIPMENTS) --- */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-[#12100e] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl z-10 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                    {activeTab === 'quotes' ? <FileText size={24} /> : <Package size={24} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">
                      {activeTab === 'quotes' ? 'Quotes Sent' : 'Active Shipments'}
                    </h3>
                    <p className="text-xs font-semibold text-stone-400 mt-0.5">
                      {activeTab === 'quotes' ? 'Review all previously requested price estimates' : 'Track live logistics updates and delivery milestones'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab(null)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto pr-2 flex flex-col gap-4">
                {activeTab === 'quotes' ? (
                  quotesLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-stone-400">
                      <Loader2 size={32} className="animate-spin text-yellow-500" />
                      <span className="text-sm font-bold">Loading your quotes...</span>
                    </div>
                  ) : userQuotes.length > 0 ? (
                    userQuotes.map((quote, index) => (
                      <div key={quote.id || index} className="bg-[#090807] border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="text-xs font-extrabold text-yellow-400 tracking-wider">QUOTE #{quote.id || index + 1}</span>
                          <span className="text-xs font-medium text-stone-400">
                            {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white">{quote.message || 'N/A'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-stone-400 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-stone-500 mb-1">
                        <FileText size={28} />
                      </div>
                      <h4 className="text-lg font-bold text-white">No Quotes Found</h4>
                      <p className="text-sm max-w-sm text-stone-400">You haven't requested any freight or shipping quotes yet.</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-stone-400 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-stone-500 mb-1">
                      <Package size={28} />
                    </div>
                    <h4 className="text-lg font-bold text-white">No Active Shipments</h4>
                    <p className="text-sm max-w-sm text-stone-400">There are no active shipments currently linked to your account profile.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="w-full py-8 border-t border-white/5 text-center text-stone-500 text-xs font-medium tracking-wide">
        © {new Date().getFullYear()} JB Logistics Services. All rights reserved.
      </footer>
    </div>
  );
}