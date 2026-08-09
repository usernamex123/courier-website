import React from "react";
import { X } from "lucide-react";

export default function BulkActionBar({ count, onClear, children }) {
  if (!count) return null;
  
  return (
    <div className="flex flex-wrap items-center gap-3 bg-[#0c0a09] border border-white/10 text-white rounded-2xl px-5 py-3.5 shadow-2xl animate-fadeIn">
      <span className="text-xs font-bold uppercase tracking-wider font-mono text-yellow-400">
        {count} selected
      </span>
      <div className="h-4 w-px bg-white/10" />
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <button 
        onClick={onClear} 
        className="ml-auto flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" /> Clear
      </button>
    </div>
  );
}