import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", 
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const InputField = ({ placeholder, type, value, onChange, error }) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1 w-full text-left">
      <div className={`relative border ${error ? 'border-red-500' : 'border-white'} bg-[#1c1917] p-3 shadow-[0_0_4px_rgba(255,255,255,0.2)] transition-all`}>
        <input
          type={type}
          placeholder={isFocused ? "" : placeholder}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={onChange}
          autoComplete="off"
          className="w-full bg-transparent text-white outline-none placeholder-white/70"
        />
      </div>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default function GroundFreight() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', state: '', message: '' });
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const validate = () => {
    let newErrors = {};
    if (!formData.name) newErrors.name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = "10-digit number required";
    if (!formData.state) newErrors.state = "Please select a state";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      const { error } = await supabase.from('messages').insert([formData]);
      setIsSubmitting(false);
      
      if (error) {
        alert("Error: " + error.message);
      } else {
        alert("Message sent successfully!");
        setFormData({ name: '', email: '', phone: '', state: '', message: '' });
        toggleModal(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
        <source src="/groundvideo.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <h1 className="text-5xl md:text-8xl font-black text-white uppercase mb-6">GROUND FREIGHT</h1>
        <p className="text-white text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Reliable, efficient, and cost-effective ground transportation solutions tailored to your business needs. 
          From local delivery to cross-country logistics, we ensure your cargo arrives safely and on time.
        </p>
        <button onClick={() => toggleModal(true)} className="border-2 border-white hover:bg-yellow-400 hover:border-yellow-400 hover:text-black transition-all text-white px-10 py-4 font-bold uppercase tracking-[0.2em]">
          Request Quote
        </button>
      </div>

      {shouldRender && (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto pt-24 p-6 bg-[#1c1917] transition-opacity duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={() => toggleModal(false)} className="absolute top-6 right-10 text-4xl text-white hover:text-yellow-400 transition-colors">✕</button>
          
          <div className="w-full max-w-xl text-center pb-20">
            <h2 className="text-4xl font-extrabold text-white uppercase mb-8">REQUEST A QUOTE</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <InputField placeholder="Full Name*" type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} error={errors.name} />
              <InputField placeholder="Email Address*" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} error={errors.email} />
              <InputField placeholder="Phone Number*" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} error={errors.phone} />
              
              <div className="relative w-full" ref={dropdownRef}>
                <div 
                  onClick={() => setIsOpen(!isOpen)}
                  className={`w-full py-3 px-4 bg-[#1c1917] border ${errors.state ? 'border-red-500' : 'border-white'} text-white cursor-pointer flex justify-between items-center transition-all`}
                >
                  {formData.state || "Select State*"}
                  <svg 
                    className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isOpen && (
                  <div className="absolute top-full left-0 w-full max-h-60 overflow-y-auto z-[60] bg-[#1c1917] border border-white mt-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-yellow-400 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {usStates.map((state) => (
                      <div key={state} onClick={() => { setFormData({...formData, state}); setIsOpen(false); }} className="px-4 py-2 hover:bg-yellow-400 hover:text-black cursor-pointer text-left transition-colors">
                        {state}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.state && <span className="text-red-500 text-xs text-left">{errors.state}</span>}

              <textarea placeholder="Message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full py-3 px-4 bg-[#1c1917] border border-white text-white outline-none h-20" />
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="border-2 border-white hover:bg-yellow-400 hover:border-yellow-400 hover:text-black transition-all text-white py-4 font-bold uppercase tracking-[0.2em] mt-2 disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}