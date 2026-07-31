import React from 'react';
import { FileText, Package, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserFeatures({ onOpenTab }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Quotes Sent Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onOpenTab('quotes')}
        className="bg-gradient-to-b from-[#141210] to-[#0d0c0a] border border-white/10 hover:border-yellow-500/40 rounded-[2rem] p-6 flex flex-col justify-between shadow-2xl cursor-pointer group transition-all duration-300 relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all pointer-events-none"></div>
        
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform duration-300">
            <FileText size={22} />
          </div>
          <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-yellow-500 group-hover:text-black text-stone-400 flex items-center justify-center transition-all duration-300">
            <ArrowUpRight size={16} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-5">
          <h3 className="text-lg font-extrabold text-white tracking-tight group-hover:text-yellow-400 transition-colors">
            Quotes Sent
          </h3>
          <p className="text-xs font-medium text-stone-400 leading-relaxed">
            View and track all price estimates submitted with your registered account email.
          </p>
        </div>
      </motion.div>

      {/* Active Shipments Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onOpenTab('shipments')}
        className="bg-gradient-to-b from-[#141210] to-[#0d0c0a] border border-white/10 hover:border-yellow-500/40 rounded-[2rem] p-6 flex flex-col justify-between shadow-2xl cursor-pointer group transition-all duration-300 relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none"></div>
        
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-300">
            <Package size={22} />
          </div>
          <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-amber-400 group-hover:text-black text-stone-400 flex items-center justify-center transition-all duration-300">
            <ArrowUpRight size={16} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-5">
          <h3 className="text-lg font-extrabold text-white tracking-tight group-hover:text-amber-400 transition-colors">
            Active Shipments
          </h3>
          <p className="text-xs font-medium text-stone-400 leading-relaxed">
            Monitor real-time status updates and delivery logs for your active cargo.
          </p>
        </div>
      </motion.div>
    </div>
  );
}