import { motion } from "framer-motion";

function Hero() {
  return (
    <section className="relative min-h-[calc(90vh+189px)] flex items-center justify-start overflow-hidden bg-black font-brand">
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
      <div className="w-full max-w-4xl pl-16 pt-64 relative z-10 text-left flex flex-col items-start text-white">
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.95]"
        >
          SMART SHIPPING <br />
          LOGISTICS COMPANY
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-200 text-lg md:text-xl max-w-2xl font-medium leading-relaxed mt-6"
        >
          Ship freight seamlessly, track high-fidelity delivery telemetry in real time, and scale your product dispatch workflows with JB Logistics Services.
        </motion.p>
        
        {/* Buttons have been removed */}
      </div>
    </section>
  );
}

export default Hero;