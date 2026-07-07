import { Package } from "lucide-react";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-slate-900/70 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        <div className="flex items-center gap-3">
          <Package size={28} className="text-blue-400" />
          <h1 className="text-2xl font-bold tracking-wide">
            NepalExpress
          </h1>
        </div>

        <ul className="hidden md:flex gap-8 text-gray-300">
          <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">
            Home
          </li>

          <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">
            Services
          </li>

          <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">
            Tracking
          </li>

          <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">
            Contact
          </li>
        </ul>

        <button className="bg-blue-500 hover:bg-blue-600 transition-all duration-300 px-5 py-2 rounded-xl font-semibold">
          Get Quote
        </button>

      </div>
    </nav>
  );
}

export default Navbar;