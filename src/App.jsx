import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import WhyChooseUs from "./components/WhyChooseUs";
import Stats from "./components/Stats";
import HowItWorks from "./components/HowItWorks";
import Tracking from "./components/Tracking";
import Footer from "./components/Footer";
import Reveal from "./components/Reveal";

function App() {
  return (
    <>
      <Navbar />

      <Reveal>
        <Hero />
      </Reveal>

      <Reveal>
        <Services />
      </Reveal>

      <Reveal>
        <WhyChooseUs />
      </Reveal>

      <Reveal>
        <Stats />
      </Reveal>

      <Reveal>
        <HowItWorks />
      </Reveal>

      <Reveal>
        <Tracking />
      </Reveal>

      <Reveal>
        <Footer />
      </Reveal>

    </>
  );
}

export default App;