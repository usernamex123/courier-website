import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

function Hero() {
  const location = useLocation();
  const navigate = useNavigate();

  // Custom handler to scroll to sections on the homepage or navigate home first if on a subpage
  const handleHomeScroll = (e, id) => {
    e.preventDefault();

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section className="relative min-h-[calc(90vh+189px)] flex items-start justify-center pt-36 overflow-hidden bg-black font-brand">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/video.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="w-full max-w-4xl px-6 relative z-10 text-center flex flex-col items-center text-white">
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[1.1] text-white"
        >
          Your Trusted <br />
          <span className="text-yellow-500">Moving Partner</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-200 text-base sm:text-lg md:text-xl max-w-2xl font-medium leading-relaxed mt-4"
        >
          Seamless shipping solutions for every destination.
        </motion.p>
        
        {/* Request A Quote Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <a 
            href="#get-started" 
            onClick={(e) => handleHomeScroll(e, 'get-started')}
            className="bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-black px-8 py-4 rounded-none font-black text-base uppercase tracking-wider inline-flex items-center justify-center text-center transition-all duration-300 shrink-0 cursor-pointer shadow-2xl"
          >
            <span>Request A Quote</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;