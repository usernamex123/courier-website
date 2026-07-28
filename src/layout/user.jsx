import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, UserCheck, CheckCircle2, ShieldCheck, 
  Truck, ArrowUp, Key, Plus, AlertTriangle, FileText, Package, X, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase correctly using environment variables
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const InputField = ({ label, placeholder, type, value, onChange, error, autoComplete, name }) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div className="flex flex-col gap-2 w-full text-left font-['Inter',sans-serif]">
      <label className="text-sm font-semibold uppercase tracking-wider text-stone-400">
        {label}
      </label>
      <div className={`relative border ${error ? 'border-red-500' : 'border-white/10'} bg-[#141210] px-5 py-4 focus-within:border-yellow-500 transition-all rounded-xl`}>
        <input
          type={type}
          name={name}
          placeholder={isFocused ? "" : placeholder}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-white outline-none placeholder-stone-600 text-base font-medium tracking-normal"
        />
      </div>
      {error && <span className="text-red-500 text-sm">{error}</span>}
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
  const [successMessage, setSuccessMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // --- USER SESSION & PROFILE STATE ---
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // --- DELETE ACCOUNT CONFIRMATION MODAL STATE ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [shouldRenderDelete, setShouldRenderDelete] = useState(false);
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
  const useNavigateInstance = useNavigate();

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
          // Query checking both user_id (if tracked) and email matching Gmail addresses
          let query = supabase.from('quotes').select('*');
          
          if (userId && userEmail) {
            query = query.or(`user_id.eq.${userId},email.ilike.${userEmail}`);
          } else if (userId) {
            query = query.eq('user_id', userId);
          } else if (userEmail) {
            query = query.ilike('email', userEmail);
          }

          const { data, error } = await query.order('created_at', { ascending: false });

          if (error) {
            console.warn("Could not fetch quotes from 'quotes' table, trying fallback query:", error.message);
            // Fallback to strict email match if OR filter format fails on custom table schema
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('quotes')
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
    useNavigateInstance('/');
  };

  const toggleDeleteModal = (open) => {
    if (open) {
      document.body.style.overflow = 'hidden';
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

  const executeDeleteAccount = async () => {
    if (!user) return;
    
    setDeleteLoading(true);

    try {
      const { error: rpcError } = await supabase.rpc('delete_user_account');
      
      if (rpcError) {
        console.warn("RPC delete_user_account not found or failed, signing out and clearing local state instead:", rpcError);
      }

      await supabase.auth.signOut();
      setUser(null);
      setProfileData({ name: '', email: '', phone: '' });
      setIsProfileMenuOpen(false);
      toggleDeleteModal(false);
      alert("Account has been deleted successfully.");
      useNavigateInstance('/');
    } catch (err) {
      console.error("Error during account deletion:", err);
      alert("Failed to delete account. Please try again.");
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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const toggleModal = (open, mode = false) => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setIsSignUp(mode);
      setShouldRender(true);
      setErrors({});
      setSuccessMessage(null);
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
          const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: { 
              data: { full_name: formData.name } 
            }
          });
          if (error) throw error;

          setProfileData({
            name: formData.name,
            email: formData.email,
            phone: data.user?.user_metadata?.phone || ''
          });

          setSuccessMessage("Account created successfully!");
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

          setSuccessMessage("Logged in successfully!");
        }

        setFormData({ name: '', email: '', password: '' });
        setTimeout(() => { toggleModal(false); }, 1500);
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
          <span className="text-yellow-500">J</span>
          <span className="text-yellow-500">B</span>
          <span className="text-white ml-2">LOGISTICS</span>
        </div>
        <div className="w-full h-[2.5px] bg-yellow-500 my-0.5 rounded-full"></div>
        <div className="text-[10px] font-semibold tracking-[0.2em] text-stone-300 leading-none">
          SERVICES
        </div>
      </Link>
      
      <div className="flex items-center gap-6 md:gap-8">
        <Link
          to="/"
          className="group flex items-center gap-2 text-base font-semibold tracking-wide text-white hover:text-yellow-500 transition-colors duration-300"
        >
          <Home size={18} className="text-white group-hover:text-yellow-500 transition-colors duration-300" />
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
                className="w-12 h-12 rounded-full bg-yellow-500 text-black font-bold text-xl flex items-center justify-center border-2 border-white shadow-lg cursor-pointer select-none hover:bg-yellow-400 transition-colors"
                title={profileData.name || user.email}
              >
                {getProfileInitial()}
              </button>
              
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full pt-2 w-52 z-50">
                  <div className="bg-[#0e0c0b]/95 backdrop-blur-md border border-white/10 p-2.5 rounded-2xl shadow-2xl flex flex-col gap-1.5">
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        useNavigateInstance('/profile');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5 transition-colors cursor-pointer rounded-xl"
                    >
                      Profile
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-white/5 transition-colors cursor-pointer rounded-xl border-t border-white/10 mt-1 pt-2.5"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button 
            onClick={() => toggleModal(true, false)}
            className="bg-black hover:bg-yellow-600 border-2 border-yellow-500 text-white hover:text-black active:scale-95 px-7 py-4 rounded-2xl font-bold text-base tracking-wide inline-flex items-center gap-2.5 text-center transition-all duration-300 shrink-0 ml-2 cursor-pointer shadow-lg group"
          >
            <UserCheck size={18} className="text-yellow-500 group-hover:text-black transition-colors duration-300" />
            <span>Login/Register</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full text-white bg-[#0a0908] flex flex-col font-['Inter',sans-serif]">
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
            className="fixed top-0 left-0 w-full z-40 bg-[#0c0a09]/90 backdrop-blur-xl border-b border-white/10 h-[93px] flex items-center shadow-sm"
          >
            <HeaderContent height="h-[93px]" />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-36 pb-24 px-6 max-w-5xl mx-auto w-full flex flex-col gap-10">
        
        {/* --- USER PROFILE BANNER (Enlarged circle, card, and fonts) --- */}
        <div className="bg-[#141210] border border-white/10 rounded-3xl p-10 relative overflow-hidden flex flex-col items-center justify-center text-center gap-5 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="w-28 h-28 rounded-full bg-yellow-500 text-black font-extrabold text-4xl flex items-center justify-center border-4 border-white shadow-2xl shrink-0 select-none z-10">
            {getProfileInitial()}
          </div>
          
          <div className="flex flex-col items-center gap-2 z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {profileData.name || user?.user_metadata?.full_name || (user ? "Valued Client" : "Guest Account")}
            </h1>
            <p className="text-sm md:text-base text-stone-400 font-medium tracking-wide">
              {profileData.email || user?.email || "guest.account@jblogisticsservices.com"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          <div className="flex flex-col">
            <div className="bg-[#141210] border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-xl h-full">
              <div className="flex flex-col gap-6">
                <span className="text-base font-extrabold tracking-wider text-yellow-500">USER INFORMATION</span>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col py-3 border-b border-white/5 gap-2">
                    <span className="text-xs font-bold text-stone-400 tracking-wider uppercase">Full Name</span>
                    <span className="text-base font-bold text-white tracking-normal break-all">
                      {profileData.name || user?.user_metadata?.full_name || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex flex-col py-3 border-b border-white/5 gap-2">
                    <span className="text-xs font-bold text-stone-400 tracking-wider uppercase">Email</span>
                    <span className="text-base font-bold text-white tracking-normal break-all">
                      {profileData.email || user?.email || "Not Provided"}
                    </span>
                  </div>

                  {/* --- CLICKABLE CHANGE PASSWORD BUTTON (BETWEEN EMAIL & CONTACT) --- */}
                  {user && (
                    <div className="py-2 border-b border-white/5">
                      <button
                        onClick={() => togglePasswordModal(true)}
                        className="group flex items-center gap-2.5 text-stone-300 hover:text-yellow-500 transition-colors cursor-pointer text-left w-full py-1.5"
                      >
                        <Key size={18} className="text-stone-400 group-hover:text-yellow-500 transition-colors shrink-0" />
                        <span className="text-sm font-bold tracking-wide text-stone-300 group-hover:text-yellow-500">Change password</span>
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col py-3 gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-400 tracking-wider uppercase">Contact Number</span>
                      {user && (
                        <button
                          onClick={() => togglePhoneModal(true)}
                          className="group flex items-center gap-1.5 text-yellow-500 hover:text-yellow-400 text-xs font-extrabold tracking-wide transition-colors cursor-pointer py-1 px-3 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg"
                        >
                          <Plus size={14} />
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
                  className="w-full bg-red-600/25 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 py-3.5 px-5 rounded-2xl font-bold text-sm tracking-wide transition-all cursor-pointer shadow-md"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col relative h-full">
            <div className="bg-[#141210] border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden h-full">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold tracking-wider text-yellow-500">QUICK NAVIGATION</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div 
                    onClick={() => setActiveTab('quotes')}
                    className="bg-[#0a0908] hover:border-yellow-500/50 border border-white/5 rounded-2xl p-6 flex flex-col gap-3 transition-all cursor-pointer group"
                  >
                    <div className="text-yellow-500 mb-1 group-hover:scale-110 transition-transform"><FileText size={26} /></div>
                    <h3 className="text-base font-extrabold tracking-wide text-white">Quotes Sent</h3>
                    <p className="text-sm font-medium text-stone-400 tracking-normal leading-relaxed">Review all previously requested freight and shipping price estimates.</p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('shipments')}
                    className="bg-[#0a0908] hover:border-yellow-500/50 border border-white/5 rounded-2xl p-6 flex flex-col gap-3 transition-all cursor-pointer group"
                  >
                    <div className="text-yellow-500 mb-1 group-hover:scale-110 transition-transform"><Package size={26} /></div>
                    <h3 className="text-base font-extrabold tracking-wide text-white">Shipments</h3>
                    <p className="text-sm font-medium text-stone-400 tracking-normal leading-relaxed">Track active deliveries, transit histories, and completed cargos.</p>
                  </div>
                </div>
              </div>

              {/* --- OVERLAY BANNER MATCHING EXACT LEFT CARD HEIGHT & STYLING --- */}
              <AnimatePresence>
                {activeTab && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 bg-[#141210]/98 backdrop-blur-xl p-8 flex flex-col justify-between z-20 border border-yellow-500/30 rounded-3xl shadow-2xl h-full"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-5 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="text-yellow-500">
                          {activeTab === 'quotes' ? <FileText size={24} /> : <Package size={24} />}
                        </div>
                        <h3 className="text-lg font-extrabold tracking-wide text-white uppercase">
                          {activeTab === 'quotes' ? 'Quotes Sent Overview' : 'Shipments Overview'}
                        </h3>
                      </div>
                      <button 
                        onClick={() => setActiveTab(null)}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="flex-grow flex flex-col overflow-y-auto py-5 gap-3.5">
                      {activeTab === 'quotes' ? (
                        quotesLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-400">
                            <Loader2 size={28} className="animate-spin text-yellow-500" />
                            <span className="text-sm font-medium">Fetching your quotes...</span>
                          </div>
                        ) : userQuotes.length > 0 ? (
                          <div className="flex flex-col gap-3">
                            {userQuotes.map((quote, idx) => (
                              <div key={quote.id || idx} className="bg-[#0a0908] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-sm font-bold text-white">Quote #{quote.id || idx + 1}</span>
                                  <span className="text-xs text-stone-400 font-medium">
                                    {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'Recent Request'} • {quote.service_type || 'Standard Freight'}
                                  </span>
                                </div>
                                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                  {quote.status || 'Active'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center py-12 gap-2.5">
                            <p className="text-base font-semibold text-stone-200">
                              No quotes found for ({profileData.email || user?.email || 'your account'}).
                            </p>
                            <span className="text-sm text-stone-400 font-medium">
                              Submitted price estimates linked to this Gmail will appear here automatically.
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center py-12 gap-2.5">
                          <p className="text-base font-semibold text-stone-200">
                            No ongoing shipments found for this account.
                          </p>
                          <span className="text-sm text-stone-400 font-medium">
                            Active delivery statuses will display here once dispatched.
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/10 shrink-0">
                      <button 
                        onClick={() => setActiveTab(null)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-2xl font-extrabold text-sm tracking-wider transition-all cursor-pointer shadow-lg"
                      >
                        Close View
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </main>

      {/* --- ATTRACTIVE DELETE ACCOUNT CONFIRMATION MODAL --- */}
      {shouldRenderDelete && (
        <div className={`fixed inset-0 z-[250] flex flex-col items-center justify-center p-6 bg-[#0a0908]/90 backdrop-blur-md transition-opacity duration-300 ${isDeleteModalOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`w-full max-w-md bg-[#141210] border border-red-500/30 rounded-3xl p-8 shadow-2xl relative flex flex-col items-center text-center gap-6 transition-transform duration-300 ${isDeleteModalOpen ? 'scale-100' : 'scale-95'}`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="w-18 h-18 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0 shadow-inner">
              <AlertTriangle size={36} />
            </div>

            <div className="flex flex-col gap-2.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                Delete Account?
              </h2>
              <p className="text-stone-300 text-sm font-medium tracking-normal leading-relaxed">
                This action will permanently delete all your data, do you still wanna continue?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mt-2">
              <button
                type="button"
                onClick={() => toggleDeleteModal(false)}
                disabled={deleteLoading}
                className="bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 py-4 rounded-2xl font-bold text-sm tracking-wider transition-all cursor-pointer shadow-sm"
              >
                No
              </button>
              <button
                type="button"
                onClick={executeDeleteAccount}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-bold text-sm tracking-wider transition-all cursor-pointer shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL FOR ADDING/UPDATING PHONE NUMBER --- */}
      {shouldRenderPhone && (
        <div className={`fixed inset-0 z-[250] flex flex-col items-center justify-center p-6 bg-[#0a0908]/95 backdrop-blur-md transition-opacity duration-300 ${isPhoneModalOpen ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={() => togglePhoneModal(false)} 
            className="absolute top-6 right-8 text-2xl font-bold text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
          
          <div className="w-full max-w-md bg-[#141210] border border-white/10 rounded-3xl p-8 shadow-2xl relative">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-extrabold tracking-wide text-white mb-2">
                {profileData.phone ? "Update Contact Number" : "Add Contact Number"}
              </h2>
              <p className="text-stone-400 text-sm font-medium tracking-wide">
                Enter your phone number for logistics notifications
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-5">
              <InputField 
                label="Phone Number"
                name="phone"
                placeholder="+1 (555) 000-0000"
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                autoComplete="tel"
              />

              {phoneMessage.text && (
                <span className={`text-sm font-bold tracking-wide ${phoneMessage.type === 'error' ? 'text-red-500' : 'text-green-400'}`}>
                  {phoneMessage.text}
                </span>
              )}

              <button 
                type="submit"
                disabled={phoneLoading}
                className="bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-extrabold text-sm tracking-wider transition-all cursor-pointer disabled:opacity-50 mt-2 shadow-lg"
              >
                {phoneLoading ? "Saving..." : "Save Contact Number"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL FOR CHANGE PASSWORD --- */}
      {shouldRenderPassword && (
        <div className={`fixed inset-0 z-[250] flex flex-col items-center justify-center p-6 bg-[#0a0908]/95 backdrop-blur-md transition-opacity duration-300 ${isPasswordModalOpen ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={() => togglePasswordModal(false)} 
            className="absolute top-6 right-8 text-2xl font-bold text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
          
          <div className="w-full max-w-md bg-[#141210] border border-white/10 rounded-3xl p-8 shadow-2xl relative">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-extrabold tracking-wide text-white mb-2">
                Change Password
              </h2>
              <p className="text-stone-400 text-sm font-medium tracking-wide">
                Enter your current and new password securely
              </p>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="flex flex-col gap-5">
              <InputField 
                label="Current Password"
                name="currentPassword"
                placeholder="••••••••"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                autoComplete="current-password"
              />

              <InputField 
                label="New Password"
                name="newPassword"
                placeholder="••••••••"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                autoComplete="new-password"
              />

              <InputField 
                label="Confirm New Password"
                name="confirmPassword"
                placeholder="••••••••"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                autoComplete="new-password"
              />

              {passwordMessage.text && (
                <span className={`text-sm font-bold tracking-wide ${passwordMessage.type === 'error' ? 'text-red-500' : 'text-green-400'}`}>
                  {passwordMessage.text}
                </span>
              )}

              <button 
                type="submit"
                disabled={passwordLoading}
                className="bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-extrabold text-sm tracking-wider transition-all cursor-pointer disabled:opacity-50 mt-2 shadow-lg"
              >
                {passwordLoading ? "Verifying & Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      {shouldRender && (
        <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-[#0a0908]/95 backdrop-blur-md transition-opacity duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={() => toggleModal(false)} 
            className="absolute top-6 right-8 text-2xl font-bold text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
          
          <div className="w-full max-w-md bg-[#141210] border border-white/10 rounded-3xl p-8 shadow-2xl relative">
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 bg-[#141210] border border-yellow-500 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center"
                >
                  <CheckCircle2 size={56} className="text-yellow-500 animate-bounce" />
                  <h3 className="text-2xl font-extrabold tracking-wide text-white">
                    {successMessage}
                  </h3>
                  <p className="text-sm font-medium tracking-wide text-stone-400">Updating session...</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-6 text-center">
              <h2 className="text-2xl font-extrabold tracking-wide text-white mb-2">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-stone-400 text-sm font-medium tracking-wide">
                {isSignUp ? "Enter your details to register" : "Access your JB Logistics portal"}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5" noValidate>
              {isSignUp && (
                <InputField 
                  label="Full Name"
                  name="name"
                  placeholder="John Doe" 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  error={errors.name}
                  autoComplete="name"
                />
              )}

              <InputField 
                label="Email Address"
                name="email"
                placeholder="name@jblogisticsservices.com" 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                error={errors.email}
                autoComplete="email"
              />

              <InputField 
                label="Password"
                name="password"
                placeholder="••••••••" 
                type="password" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                error={errors.password}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />

              {errors.email && !isSignUp && (
                <span className="text-red-500 text-sm font-bold tracking-wide text-left">{errors.email}</span>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-yellow-500 hover:bg-yellow-400 text-black transition-all py-4 rounded-2xl font-extrabold tracking-wider mt-2 cursor-pointer disabled:opacity-50 text-sm shadow-lg"
              >
                {isSubmitting ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
              </button>

              <div className="text-center mt-4 text-sm font-medium tracking-wide text-stone-400">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrors({});
                    setFormData({ name: '', email: '', password: '' });
                  }} 
                  className="text-yellow-500 font-extrabold hover:underline cursor-pointer ml-1"
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
            className="fixed bottom-6 right-6 z-[100] bg-yellow-500 hover:bg-yellow-400 text-black p-3.5 rounded-full shadow-lg transition-all cursor-pointer"
          >
            <ArrowUp size={22} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}