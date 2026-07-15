export default function Contact() {
  return (
    <section className="w-full bg-black text-white py-20 px-10 md:px-24">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Heading */}
        <h1 className="text-4xl font-black uppercase tracking-widest text-center mb-20">
          Contact Us
        </h1>

        {/* HORIZONTAL ALIGNMENT: 3 Columns */}
        <div className="grid md:grid-cols-3 gap-12 items-start">
          
          {/* COLUMN 1: Contact Info */}
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-sm text-yellow-500 font-extrabold uppercase tracking-widest">Email</p>
              <p className="text-lg font-semibold"></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-yellow-500 font-extrabold uppercase tracking-widest">Address</p>
              <p className="text-lg font-semibold"></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-yellow-500 font-extrabold uppercase tracking-widest">Phone</p>
              <p className="text-lg font-semibold"></p>
            </div>
          </div>

          {/* COLUMN 2: Follow Us */}
          <div className="flex flex-col items-center space-y-6">
            <span className="text-sm font-extrabold uppercase tracking-widest text-yellow-500">Follow Us</span>
            <div className="flex gap-6 text-white items-center">
              {/* Instagram */}
              <a href="#" className="hover:text-yellow-500 transition-colors duration-1000">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              
              {/* Official Style X Logo */}
              <a href="#" className="hover:text-yellow-500 transition-colors duration-1000">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              
              {/* LinkedIn */}
              <a href="#" className="hover:text-yellow-500 transition-colors duration-1000">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>

          {/* COLUMN 3: Get In Touch */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight text-right">
              GET IN TOUCH
            </h2>
            
            <form className="space-y-4">
              <input 
                type="email" 
                placeholder="Enter your email *" 
                className="w-full p-4 bg-transparent border-2 border-white/20 text-white placeholder-white/50 outline-none focus:border-yellow-500 transition-colors duration-1000 font-semibold" 
              />
              
              <button 
                type="submit"
                className="w-full bg-transparent text-white font-black py-4 uppercase tracking-widest border-2 border-white transition-all duration-1000 ease-in-out hover:bg-yellow-500 hover:text-black hover:border-yellow-500 shadow-lg"
              >
                Send
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}