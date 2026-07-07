import { motion } from "framer-motion";
import { Search } from "lucide-react";

function Tracking() {
  return (
    <section className="bg-slate-950 text-white py-28 px-8">
      <div className="max-w-5xl mx-auto text-center">

        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .8 }}
          className="text-5xl font-bold"
        >
          Track Your Shipment
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: .2 }}
          className="text-gray-400 mt-6"
        >
          Enter your tracking number and follow your parcel in real time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: .9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: .4 }}
          className="mt-12 flex flex-col md:flex-row gap-4 justify-center"
        >

          <div className="relative flex-1">

            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />

            <input
              type="text"
              placeholder="Enter Tracking Number"
              className="w-full bg-slate-800 border border-white/10 rounded-xl py-4 pl-14 pr-4 outline-none focus:border-blue-500"
            />

          </div>

          <button className="bg-blue-500 hover:bg-blue-600 px-8 rounded-xl transition-all duration-300 font-semibold">
            Track
          </button>

        </motion.div>

      </div>
    </section>
  );
}

export default Tracking;