import React, { useState } from 'react';
import { toast } from 'sonner';

// Change this in GetStarted.jsx
import { supabase } from '../../supabase';

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
      <div className={`relative border ${error ? 'border-red-500' : 'border-white'} bg-white/5 p-4 shadow-inner transition-all`}>
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
          className="w-full bg-transparent text-white outline-none placeholder-white/90"
        />
      </div>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default function GetStarted() {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    }

    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldsToValidate = ['firstName', 'lastName', 'email', 'phone'];
    let allValid = true;

    fieldsToValidate.forEach(field => {
      validateField(field, formData[field]);
      if (errors[field] || !formData[field]) allValid = false;
    });

    if (allValid) {
      setIsSubmitting(true);
      
      const payload = { 
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        source: 'Get Started Form'
      };

      const { error } = await supabase.from('messages').insert([payload]);

      if (error) {
        toast.error("Failed to send message: " + error.message);
        console.error("Supabase Error:", error);
      } else {
        toast.success("Message sent successfully!");
        setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
      }
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      className="w-full relative h-[820px] flex items-center bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: "url('/getstarted.png')" }}
    >
      <div className="absolute inset-0 bg-black/20 z-0" />

      <div className="absolute left-10 md:left-24 top-40 z-10 max-w-2xl">
        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight drop-shadow-lg mb-6 whitespace-nowrap">
          GET STARTED
        </h2>
        <p className="text-white text-xl leading-relaxed drop-shadow-md max-w-md">
          Kindly provide your details, and a member of our team will contact you at their earliest convenience.
        </p>
      </div>

      <div className="absolute right-0 top-0 h-full w-full md:w-1/2 z-10 bg-[#000000]/45 backdrop-blur-md p-12 md:p-24 flex flex-col justify-center">
        <div className="max-w-lg mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-2 gap-6">
              <InputField placeholder="First name *" type="text" value={formData.firstName} onChange={(val) => setFormData({...formData, firstName: val})} onBlur={() => validateField('firstName', formData.firstName)} error={errors.firstName} autoComplete="given-name" />
              <InputField placeholder="Last name *" type="text" value={formData.lastName} onChange={(val) => setFormData({...formData, lastName: val})} onBlur={() => validateField('lastName', formData.lastName)} error={errors.lastName} autoComplete="family-name" />
            </div>
            
            <InputField placeholder="Email address *" type="email" value={formData.email} onChange={(val) => setFormData({...formData, email: val})} onBlur={() => validateField('email', formData.email)} error={errors.email} autoComplete="email" />
            <InputField placeholder="Phone number *" type="tel" value={formData.phone} onChange={(val) => setFormData({...formData, phone: val})} onBlur={() => validateField('phone', formData.phone)} error={errors.phone} autoComplete="tel" isNumeric />
            
            <textarea 
              placeholder="Message" 
              rows="6" 
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full p-4 bg-white/5 shadow-inner border-2 border-white text-white placeholder-white/90 outline-none focus:bg-white/10 transition-all" 
            />
            
            <label className="flex items-start space-x-3 text-white/90 text-sm">
              <input type="checkbox" className="mt-1 accent-yellow-500" required />
              <span>By clicking "Send now", you read and agree to our <a href="#" className="text-yellow-500 underline">Privacy Policy</a></span>
            </label>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-transparent text-white font-bold py-5 uppercase tracking-widest border-2 border-white transition-all duration-500 ease-in-out hover:bg-yellow-500 hover:text-black hover:border-yellow-500 shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "SEND"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}