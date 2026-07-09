import Hero from "../components/Hero";
import Services from "../components/Services";
import WhyChooseUs from "../components/WhyChooseUs";
import Stats from "../components/Stats";
import HowItWorks from "../components/HowItWorks";
import Tracking from "../components/Tracking";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import BackToTop from "../components/BackToTop";

export default function Home() {
  return (
    <main className="w-full">
      <Hero />
      <Reveal><Services /></Reveal>
      <Reveal delay={0.1}><Stats /></Reveal>
      <Reveal delay={0.2}><WhyChooseUs /></Reveal>
      <Reveal delay={0.1}><HowItWorks /></Reveal>
      <Reveal><Tracking /></Reveal>
      <Footer />
      <BackToTop />
    </main>
  );
}