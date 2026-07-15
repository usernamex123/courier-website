import Hero from "../components/Hero";
import Services from "../components/Services";
import WhyChooseUs from "../components/WhyChooseUs";
import GetStarted from "../components/GetStarted";
import AboutUs from "../components/AboutUs"; // 1. Added Import
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";

export default function Home() {
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