import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabase';
import { ChevronDown } from 'lucide-react';

const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", 
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const InputField = ({ placeholder, type, value, onChange, error, onBlur, autoComplete, isNumeric }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleChange = (e) => {
    let val = e.target.value;
    if (isNumeric) {
      val = val.replace(/\D/g, '');
    }
    onChange(val);
  };

  return (
    <div className="flex flex-col gap-1 w-full text-left">
      <div className={`relative border ${error ? 'border-red-500' : 'border-white/20 hover:border-white/40'} bg-white/5 p-4 shadow-inner transition-all duration-300 ${isFocused ? 'border-yellow-500 bg-white/10 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : ''}`}>
        <input
          type={type}
          placeholder={isFocused ? "" : placeholder}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          onChange={handleChange}
          autoComplete={autoComplete || "off"}
          className="w-full bg-transparent text-white outline-none placeholder-white/50 text-sm md:text-base font-medium"
        />
      </div>
      {error && <span className="text-red-400 text-xs font-semibold pl-1">{error}</span>}
    </div>
  );
};

export default function GetStarted() {
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    fromState: '', 
    toState: '', 
    message: '',
    agreed: false 
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  
  const fromDropdownRef = useRef(null);
  const toDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target)) {
        setIsFromOpen(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target)) {
        setIsToOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateField = (name, value) => {
    let error = "";
    const nameRegex = /^[A-Za-z\s]+$/;

    if (name === "firstName" || name === "lastName") {
      if (!value.trim()) error = "Required";
      else if (!nameRegex.test(value)) error = "Only letters allowed";
    } else if (name === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email address";
    } else if (name === "phone") {
      if (!/^[0-9]{10}$/.test(value)) error = "10-digit number required";
    } else if (name === "fromState") {
      if (!value) error = "Select origin";
    } else if (name === "toState") {
      if (!value) error = "Select destination";
    } else if (name === "agreed") {
      if (!value) error = "You must agree to the privacy policy";
    }

    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldsToValidate = ['firstName', 'lastName', 'email', 'phone', 'fromState', 'toState', 'agreed'];
    let allValid = true;

    fieldsToValidate.forEach(field => {
      const val = field === 'agreed' ? formData.agreed : formData[field];
      validateField(field, val);
      if (field === 'agreed' ? !formData.agreed : (errors[field] || !formData[field])) {
        allValid = false;
      }
    });

    if (!formData.agreed) {
      toast.error("Please agree to the Privacy Policy before sending.");
      return;
    }

    if (allValid) {
      setIsSubmitting(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();

        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        const fullMessage = `From State: ${formData.fromState}\nTo State: ${formData.toState}\n\nMessage: ${formData.message || 'No additional message provided.'}`;
        const recipientEmail = "customer_care@jblogisticsservices.com";

        // Database Payload perfectly matching your messages table columns
        const dbPayload = { 
          name: fullName,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email,
          phone: formData.phone,
          from_state: formData.fromState,
          to_state: formData.toState,
          message: fullMessage,
          source: 'Get Started Form',
          user_id: user ? user.id : null
        };

        // 1. Insert into Supabase 'messages' table
        const { error } = await supabase
          .from('messages')
          .insert([dbPayload]);

        if (error) throw error;

        // 2. Trigger Edge Function for Email Notification
        const { error: fnError } = await supabase.functions.invoke('notify-admin', {
          body: {
            name: fullName,
            email: formData.email,
            phone: formData.phone,
            from_state: formData.fromState,
            to_state: formData.toState,
            message: fullMessage,
            source: 'Get Started Form',
            sender: formData.email,
            recipient: recipientEmail
          }
        });

        if (fnError) {
          console.warn("Email notification warning:", fnError);
        }

        toast.success("Message sent successfully!");
        setFormData({ firstName: '', lastName: '', email: '', phone: '', fromState: '', toState: '', message: '', agreed: false });
        setErrors({});
      } catch (err) {
        toast.error("Failed to send message: " + (err.message || err));
        console.error("Supabase Error:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <section 
      id="get-started"
      className="w-full relative min-h-[850px] flex items-center bg-cover bg-center overflow-hidden font-brand py-16 md:py-0"
      style={{ backgroundImage: "url('/getstarted.png')" }}
    >
      <div className="absolute inset-0 bg-black/20 z-0" />

      <div className="absolute right-0 top-0 h-full w-full md:w-1/2 z-10 bg-black/85 backdrop-blur-xl px-6 sm:px-8 py-4 md:px-16 md:py-6 flex flex-col justify-center overflow-hidden border-l border-white/10 shadow-2xl">
        <div className="max-w-lg mx-auto w-full my-auto">
          
          <div className="mb-4 text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] mb-2">
              Get <span className="text-yellow-500">Started</span>
            </h2>
            <p className="text-slate-300 text-sm md:text-base font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Kindly provide your details, and a member of our logistics team will contact you at their earliest convenience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <InputField placeholder="First name *" type="text" value={formData.firstName} onChange={(val) => setFormData({...formData, firstName: val})} onBlur={() => validateField('firstName', formData.firstName)} error={errors.firstName} autoComplete="given-name" />
              <InputField placeholder="Last name *" type="text" value={formData.lastName} onChange={(val) => setFormData({...formData, lastName: val})} onBlur={() => validateField('lastName', formData.lastName)} error={errors.lastName} autoComplete="family-name" />
            </div>
            
            <InputField placeholder="Email address *" type="email" value={formData.email} onChange={(val) => setFormData({...formData, email: val})} onBlur={() => validateField('email', formData.email)} error={errors.email} autoComplete="email" />
            <InputField placeholder="Phone number *" type="tel" value={formData.phone} onChange={(val) => setFormData({...formData, phone: val})} onBlur={() => validateField('phone', formData.phone)} error={errors.phone} autoComplete="tel" isNumeric />
            
            {/* From & To State Dropdowns Side-by-Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* From State Dropdown */}
              <div className="relative w-full" ref={fromDropdownRef}>
                <div 
                  onClick={() => { setIsFromOpen(!isFromOpen); setIsToOpen(false); }}
                  className={`w-full py-3.5 px-4 bg-white/5 border ${errors.fromState ? 'border-red-500' : 'border-white/20 hover:border-white/40'} text-white cursor-pointer flex justify-between items-center shadow-inner transition-all duration-300`}
                >
                  <span className={formData.fromState ? "text-white font-medium text-sm md:text-base truncate pr-2" : "text-white/50 text-sm md:text-base font-medium truncate pr-2"}>
                    {formData.fromState || "From State *"}
                  </span>
                  <ChevronDown size={18} className={`transition-transform duration-300 text-yellow-500 shrink-0 ${isFromOpen ? 'rotate-180' : 'rotate-0'}`} />
                </div>

                {isFromOpen && (
                  <div className="absolute top-full left-0 w-full max-h-48 overflow-y-auto z-[60] bg-black/95 backdrop-blur-md border border-white/20 mt-1 shadow-2xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-yellow-500 [&::-webkit-scrollbar-thumb]:rounded-none">
                    {usStates.map((state) => (
                      <div 
                        key={state} 
                        onClick={() => { 
                          setFormData({...formData, fromState: state}); 
                          setIsFromOpen(false); 
                          validateField('fromState', state);
                        }} 
                        className="px-4 py-2.5 hover:bg-yellow-500 hover:text-black cursor-pointer text-left transition-colors text-sm md:text-base text-white font-medium border-b border-white/5 last:border-b-0"
                      >
                        {state}
                      </div>
                    ))}
                  </div>
                )}
                {errors.fromState && <span className="text-red-400 text-xs font-semibold pl-1 text-left block mt-1">{errors.fromState}</span>}
              </div>

              {/* To State Dropdown */}
              <div className="relative w-full" ref={toDropdownRef}>
                <div 
                  onClick={() => { setIsToOpen(!isToOpen); setIsFromOpen(false); }}
                  className={`w-full py-3.5 px-4 bg-white/5 border ${errors.toState ? 'border-red-500' : 'border-white/20 hover:border-white/40'} text-white cursor-pointer flex justify-between items-center shadow-inner transition-all duration-300`}
                >
                  <span className={formData.toState ? "text-white font-medium text-sm md:text-base truncate pr-2" : "text-white/50 text-sm md:text-base font-medium truncate pr-2"}>
                    {formData.toState || "To State *"}
                  </span>
                  <ChevronDown size={18} className={`transition-transform duration-300 text-yellow-500 shrink-0 ${isToOpen ? 'rotate-180' : 'rotate-0'}`} />
                </div>

                {isToOpen && (
                  <div className="absolute top-full left-0 w-full max-h-48 overflow-y-auto z-[60] bg-black/95 backdrop-blur-md border border-white/20 mt-1 shadow-2xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-yellow-500 [&::-webkit-scrollbar-thumb]:rounded-none">
                    {usStates.map((state) => (
                      <div 
                        key={state} 
                        onClick={() => { 
                          setFormData({...formData, toState: state}); 
                          setIsToOpen(false); 
                          validateField('toState', state);
                        }} 
                        className="px-4 py-2.5 hover:bg-yellow-500 hover:text-black cursor-pointer text-left transition-colors text-sm md:text-base text-white font-medium border-b border-white/5 last:border-b-0"
                      >
                        {state}
                      </div>
                    ))}
                  </div>
                )}
                {errors.toState && <span className="text-red-400 text-xs font-semibold pl-1 text-left block mt-1">{errors.toState}</span>}
              </div>
            </div>

            <textarea 
              placeholder="Message (Optional)" 
              rows="2" 
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full p-3.5 bg-white/5 shadow-inner border border-white/20 hover:border-white/40 focus:border-yellow-500 focus:bg-white/10 text-white placeholder-white/50 text-sm md:text-base outline-none transition-all duration-300 resize-none font-medium" 
            />
            
            <div className="flex flex-col gap-1 text-left">
              <label className="flex items-start space-x-3 text-slate-300 text-xs md:text-sm cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={formData.agreed}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({...formData, agreed: checked});
                    validateField('agreed', checked);
                  }}
                  className="mt-0.5 w-4 h-4 accent-yellow-500 cursor-pointer rounded-none shrink-0" 
                />
                <span className="break-words">By checking this box, you agree to our <Link to="/privacy-policy" className="text-yellow-500 hover:underline font-bold">Privacy Policy</Link></span>
              </label>
              {errors.agreed && <span className="text-red-400 text-xs font-semibold pl-1">{errors.agreed}</span>}
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-black font-extrabold py-3.5 uppercase tracking-[0.15em] text-sm md:text-base transition-all duration-300 shadow-[0_0_25px_rgba(234,179,8,0.3)] hover:shadow-[0_0_35px_rgba(234,179,8,0.5)] disabled:opacity-50 cursor-pointer rounded-none mt-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}