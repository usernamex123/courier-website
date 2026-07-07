import { motion } from "framer-motion";

function Hero() {
  return (
    <section className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-blue-400 font-semibold mb-3">
            Fast • Safe • Reliable
          </p>

          <h1 className="text-6xl font-black leading-tight">
            Delivering Across Nepal
          </h1>

          <p className="mt-6 text-gray-400 text-lg">
            Smart logistics solutions for businesses and individuals with
            real-time parcel tracking.
          </p>

          <div className="flex gap-4 mt-8">
            <button className="bg-blue-500 px-6 py-3 rounded-xl hover:bg-blue-600 transition">
              Track Shipment
            </button>

            <button className="border border-white/20 px-6 py-3 rounded-xl hover:bg-white/10 transition">
              Our Services
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 120 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="flex justify-center"
        >
          <div className="w-96 h-96 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 blur-3xl opacity-40"></div>
        </motion.div>

      </div>
    </section>
  );
}

export default Hero;