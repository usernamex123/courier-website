export default function WhyChooseUs() {
  return (
    <section className="bg-[#1c1917] py-16 text-stone-100 overflow-hidden font-sans">
      {/* Container with standard padding */}
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12">
        
        {/* Header - Balanced margin */}
        <div className="mb-16">
          <h1 className="text-7xl md:text-9xl font-extrabold tracking-tighter text-white">
            ABOUT US
          </h1>
        </div>

        {/* Content - Balanced 6/6 split */}
        <div className="grid lg:grid-cols-12 gap-16 items-start">
          
          {/* Text Block */}
          <div className="lg:col-span-6 space-y-8">
            <p className="text-slate-200 text-lg md:text-xl font-medium leading-relaxed">
              We are the dominant force in global logistics, engineering hyper-personalized supply chain dominance to shatter industry standards. Carolina Logistics doesn't just transport; we architect high-velocity growth engines for your enterprise.
            </p>
            <p className="text-slate-200 text-lg md:text-xl font-medium leading-relaxed">
              Your mission is our obsession. We operate on a razor-sharp philosophy of radical efficiency and extreme flexibility, guaranteeing that your freight is moved with military-grade precision.
            </p>
          </div>

          {/* Image - Height adjusted to 280px for a slightly taller look */}
          <div className="lg:col-span-6 relative">
            <div className="absolute -top-8 -left-8 w-28 h-28 border-l-2 border-t-2 border-amber-500"></div>
            <div className="w-full h-[280px] overflow-hidden rounded-sm">
              <img 
                src="/modern.jpg" 
                alt="City Skyline" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-28 h-28 border-r-2 border-b-2 border-amber-500"></div>
          </div>
        </div>

        {/* Footer Info - Balanced spacing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-20 border-t border-stone-800 pt-12">
          {[
            { label: "Call", value: "+123-456-7890" },
            { label: "Email", value: "hello@reallygreatsite.com" },
            { label: "Visit", value: "123 Anywhere St., Any City" }
          ].map((item, i) => (
            <div key={i} className="group">
              <p className="text-amber-500 text-xs uppercase tracking-widest mb-2">{item.label}</p>
              <p className="text-lg font-medium group-hover:text-amber-500 transition-colors cursor-pointer">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}