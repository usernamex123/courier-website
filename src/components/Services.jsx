export default function Services() {
  return (
    <section className="w-full">
      <div className="w-full h-75 bg-[#252222] flex items-center justify-center relative">
        <h2 className="text-white text-5xl font-semibold uppercase tracking-wide transform scale-y-[1.05]">
          OUR SERVICES
        </h2>
      </div>

      {/* Banner Section */}
      <div className="group relative w-full h-[400px] cursor-pointer border-y border-white/5 overflow-hidden bg-black">
        
        {/* Layer 1: Default Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-500 ease-in-out opacity-100 group-hover:opacity-0"
          style={{ backgroundImage: "url('/truck-default.png')" }}
        />

        {/* Layer 2: Hover Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100"
          style={{ backgroundImage: "url('/truck-hover.png')" }}
        />
        
        {/* Overlay - Added pointer-events-none */}
        <div className="absolute inset-0 z-10 bg-black/60 transition-colors duration-500 ease-in-out group-hover:bg-black/20 pointer-events-none" />

        {/* Content - Added pointer-events-none */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-5 pointer-events-none">
          <h3 className="text-white text-5xl font-semibold uppercase tracking-wide transform scale-y-[1.05]">
            GROUND FREIGHT
          </h3>
          <div className="mt-6 h-1 bg-yellow-500 rounded-full transition-all duration-500 ease-in-out w-16 group-hover:w-32" />
        </div>
      </div>
    </section>
  );
}