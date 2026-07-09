import { useState } from "react";
import { ChevronDown, Truck, Globe, User } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-transparent border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-5 py-6 flex justify-between items-center">
          
          {/* Logo Section */}
          <Link to="/" className="flex flex-col">
            <span className="text-3xl font-black tracking-tighter">
              <span className="text-white">SWIFT</span>
              <span className="text-blue-500">SHIP</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold -mt-1">
              Logistics Inc.
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex gap-10 items-center text-sm font-medium text-white/80">
            
            {/* Services Wrapper with Expanded Hitbox */}
            <div 
              className="relative group py-4 -my-4" 
              onMouseEnter={() => setIsOpen(true)} 
              onMouseLeave={() => setIsOpen(false)}
            >
              {/* Increased font size to 'text-sm' and added 'leading-tight' to make it feel taller */}
              <button className={`flex items-center gap-1 font-black tracking-widest text-sm uppercase transition-colors duration-300 ${isOpen ? "text-blue-500" : "hover:text-blue-400"}`}>
                Services 
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
                />
              </button>
              
              {/* Dropdown - Positioned at top-12 to clear the expanded hitbox */}
              <div className={`absolute top-12 left-0 w-56 transition-all duration-500 ease-out ${isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"}`}>
                <div className="bg-black/60 border border-white/10 rounded-xl p-2 shadow-2xl backdrop-blur-md">
                  <a href="#" className="flex items-center gap-3 p-3 hover:bg-blue-600/30 rounded-lg text-xs font-bold uppercase transition-all duration-300 group/item">
                    <Truck size={16} className="group-hover/item:text-blue-400" /> 
                    Ground Freight
                  </a>
                  <a href="#" className="flex items-center gap-3 p-3 hover:bg-blue-600/30 rounded-lg text-xs font-bold uppercase transition-all duration-300 group/item">
                    <Globe size={16} className="group-hover/item:text-blue-400" /> 
                    International
                  </a>
                </div>
              </div>
            </div>

            <Link to="/" className="hover:text-blue-400 transition">Tracking</Link>
            <Link to="/auth" className="flex items-center gap-2 bg-blue-600 px-5 py-2.5 rounded-full text-white hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
              <User size={14} /> Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main className="bg-slate-950 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}