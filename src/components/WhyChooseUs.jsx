export default function WhyChooseUs() {
  return (
    <section className="py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-5">
        {/* Header Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-white mb-4">
            Why Choose Us
          </h2>
          <div className="w-20 h-1 bg-yellow-600"></div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="p-8 border border-white/10 bg-white/5 hover:border-yellow-600/50 transition-colors">
            <h3 className="text-xl font-bold mb-3">Reliability</h3>
            <p className="text-gray-400 leading-relaxed">
              We ensure your cargo reaches its destination safely and on schedule, 
              backed by our extensive global network and tracking systems.
            </p>
          </div>

          <div className="p-8 border border-white/10 bg-white/5 hover:border-yellow-600/50 transition-colors">
            <h3 className="text-xl font-bold mb-3">Cost-Effective</h3>
            <p className="text-gray-400 leading-relaxed">
              Optimized routing and logistics solutions designed to reduce your 
              operational overhead without compromising service quality.
            </p>
          </div>

          <div className="p-8 border border-white/10 bg-white/5 hover:border-yellow-600/50 transition-colors">
            <h3 className="text-xl font-bold mb-3">24/7 Support</h3>
            <p className="text-gray-400 leading-relaxed">
              Our dedicated logistics experts are available around the clock to 
              assist with inquiries and provide real-time updates.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}