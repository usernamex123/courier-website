import React, { useEffect } from "react";
import Hero from "../components/Hero";
import Services from "../components/Services";
import WhyChooseUs from "../components/WhyChooseUs";
import GetStarted from "../components/GetStarted";
import AboutUs from "../components/AboutUs"; // 1. Added Import
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";

export default function Home() {
  // Auto-fill and submit tracking number when loaded via QR code (?track=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackingCode = params.get('track');
    
    if (trackingCode) {
      const timer = setTimeout(() => {
        // Find the tracking input field rendered inside Hero or the page
        const inputField = document.querySelector('input[placeholder*="tracking" i], input[type="text"]');
        
        if (inputField) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          nativeInputValueSetter.call(inputField, trackingCode);
          inputField.dispatchEvent(new Event('input', { bubbles: true }));

          // Find and click the track button automatically
          const buttons = Array.from(document.querySelectorAll('button'));
          const trackButton = buttons.find(b => b.textContent.toLowerCase().includes('track'));
          if (trackButton) {
            trackButton.click();
          }
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <main className="w-full bg-transparent">
      <Hero />
      <Reveal><Services /></Reveal>
      <Reveal delay={0.2}><WhyChooseUs /></Reveal>
      <Reveal delay={0.4}><GetStarted /></Reveal>
      
      {/* 2. Added AboutUs component with a reveal animation */}
      <Reveal delay={0.6}><AboutUs /></Reveal>
      
      <Reveal delay={0.8}><Contact /></Reveal>
      
      <Footer />
    </main>
  );
}