import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabase';

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
      <div className={`relative border ${error ? 'border-red-500' : 'border-white'} bg-white/5 p-3.5 shadow-inner transition-all`}>
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
          className="w-full bg-transparent text-white outline-none placeholder-white/90 text-sm md:text-base"
        />
      </div>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default function GetStarted() {
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    state: '', 
    message: '',
    agreed: false 
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
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
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email";
    } else if (name === "phone") {
      if (!/^[0-9]{10}$/.test(value)) error = "10-digit number required";
    } else if (name === "state") {
      if (!value) error = "Please select a state";
    } else if (name === "agreed") {
      if (!value) error = "You must agree to the privacy policy";
    }

    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldsToValidate = ['firstName', 'lastName', 'email', 'phone', 'state', 'agreed'];
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
      
      const payload = { 
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        state: formData.state,
        message: formData.message,
        source: 'Get Started Form'
      };

      const { error } = await supabase.from('messages').insert([payload]);

      if (error) {
        toast.error("Failed to send message: " + error.message);
        console.error("Supabase Error:", error);
      } else {
        toast.success("Message sent successfully!");
        setFormData({ firstName: '', lastName: '', email: '', phone: '', state: '', message: '', agreed: false });
        setErrors({});
      }
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      id="get-started"
      className="w-full relative min-h-[780px] flex items-center bg-cover bg-center overflow-hidden font-sans py-12 md:py-0"
      style={{ backgroundImage: "url('/getstarted.png')" }}
    >
      <div className="absolute inset-0 bg-black/20 z-0" />

      {/* Right Column: Full width/half-width form container with heading and description pulled inside */}
      <div className="absolute right-0 top-0 h-full w-full md:w-1/2 z-10 bg-[#000000]/45 backdrop-blur-md p-6 md:p-16 flex flex-col justify-center overflow-y-auto">
        <div className="max-w-lg mx-auto w-full my-auto">
          
          {/* Pulled Heading & Text Section */}
          <div className="mb-6 text-left">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter drop-shadow-lg mb-2">
              GET STARTED
            </h2>
            <p className="text-white text-sm md:text-base font-medium leading-relaxed drop-shadow-md">
              Kindly provide your details, and a member of our team will contact you at their earliest convenience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <InputField placeholder="First name *" type="text" value={formData.firstName} onChange={(val) => setFormData({...formData, firstName: val})} onBlur={() => validateField('firstName', formData.firstName)} error={errors.firstName} autoComplete="given-name" />
              <InputField placeholder="Last name *" type="text" value={formData.lastName} onChange={(val) => setFormData({...formData, lastName: val})} onBlur={() => validateField('lastName', formData.lastName)} error={errors.lastName} autoComplete="family-name" />
            </div>
            
            <InputField placeholder="Email address *" type="email" value={formData.email} onChange={(val) => setFormData({...formData, email: val})} onBlur={() => validateField('email', formData.email)} error={errors.email} autoComplete="email" />
            <InputField placeholder="Phone number *" type="tel" value={formData.phone} onChange={(val) => setFormData({...formData, phone: val})} onBlur={() => validateField('phone', formData.phone)} error={errors.phone} autoComplete="tel" isNumeric />
            
            <div className="relative w-full" ref={dropdownRef}>
              <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full py-3.5 px-4 bg-white/5 border ${errors.state ? 'border-red-500' : 'border-white'} text-white cursor-pointer flex justify-between items-center shadow-inner transition-all`}
              >
                <span className={formData.state ? "text-white" : "text-white/90 text-sm md:text-base"}>
                  {formData.state || "Select State *"}
                </span>
                <svg 
                  className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {isOpen && (
                <div className="absolute top-full left-0 w-full max-h-60 overflow-y-auto z-[60] bg-[#1c1917]/95 backdrop-blur-md border border-white mt-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-yellow-400 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {usStates.map((state) => (
                    <div 
                      key={state} 
                      onClick={() => { 
                        setFormData({...formData, state}); 
                        setIsOpen(false); 
                        validateField('state', state);
                      }} 
                      className="px-4 py-2 hover:bg-yellow-400 hover:text-black cursor-pointer text-left transition-colors text-sm md:text-base text-white"
                    >
                      {state}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.state && <span className="text-red-500 text-xs text-left block">{errors.state}</span>}

            <textarea 
              placeholder="Message" 
              rows="3" 
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full p-3.5 bg-white/5 shadow-inner border border-white text-white placeholder-white/90 text-sm md:text-base outline-none transition-all resize-none" 
            />
            
            <div className="flex flex-col gap-1 text-left">
              <label className="flex items-start space-x-3 text-white/90 text-xs md:text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.agreed}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({...formData, agreed: checked});
                    validateField('agreed', checked);
                  }}
                  className="mt-1 accent-yellow-500 cursor-pointer" 
                />
                <span>By checking this box, you agree to our <Link to="/privacy-policy" className="text-yellow-500 underline">Privacy Policy</Link></span>
              </label>
              {errors.agreed && <span className="text-red-500 text-xs">{errors.agreed}</span>}
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-transparent text-white font-bold py-4 uppercase tracking-[0.2em] text-sm md:text-base border-2 border-white transition-all duration-300 hover:bg-yellow-400 hover:text-black hover:border-yellow-400 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Sending..." : "SEND"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}