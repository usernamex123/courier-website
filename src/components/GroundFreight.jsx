import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient('https://supabase.com/dashboard/project/oqazztthndkoxoegfnuv/settings/api-keys/legacy', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYXp6dHRobmRrb3hvZWdmbnV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNzA4NjksImV4cCI6MjA5OTk0Njg2OX0.Gb28YztX_PfM4S-WHgjZwrqshvpJptqOCv53BhZTglE');

const InputField = ({ name, placeholder, type, value, onChange, error }) => {
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
        {error && (
          <span className="absolute right-3 top-3 text-red-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </span>
        )}
      </div>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default function GroundFreight() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const validate = () => {
    let newErrors = {};
    // Regex for 10-digit phone number
    const phoneRegex = /^[0-9]{10}$/;
    // Regex for standard email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name) newErrors.name = "This is a required field";
    
    if (!formData.email) {
      newErrors.email = "This is a required field";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }
    
    if (!formData.phone) {
      newErrors.phone = "This is a required field";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const { error } = await supabase.from('messages').insert([
        { name: formData.name, email: formData.email, phone: formData.phone, message: formData.message }
      ]);

      if (error) {
        alert("Error sending message: " + error.message);
      } else {
        alert("Message sent successfully!");
        setFormData({ name: '', email: '', phone: '', message: '' });
        setIsModalOpen(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
        <source src="/groundvideo.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 text-center px-6">
        <h1 className="text-5xl md:text-8xl font-black text-white uppercase mb-10">GROUND FREIGHT</h1>
        <button onClick={() => setIsModalOpen(true)} className="border-2 border-white hover:bg-yellow-400 hover:border-yellow-400 hover:text-black transition-all text-white px-10 py-4 font-bold uppercase tracking-[0.2em]">
          Request Quote
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#1c1917' }}>
          <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-16 text-6xl text-white hover:text-yellow-400">✕</button>
          <div className="w-full max-w-xl text-center">
            <h2 className="text-4xl font-extrabold text-white uppercase mb-8">REQUEST A QUOTE</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <InputField name="name" placeholder="Full Name*" type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} error={errors.name} />
              <InputField name="email" placeholder="Email Address*" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} error={errors.email} />
              <InputField name="phone" placeholder="Phone Number*" type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} error={errors.phone} />
              <textarea placeholder="Message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full py-3 px-4 bg-[#1c1917] border border-white text-white outline-none h-20" />
              <button type="submit" className="border-2 border-white hover:bg-yellow-400 hover:border-yellow-400 hover:text-black transition-all text-white py-4 font-bold uppercase tracking-[0.2em] mt-2">
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}