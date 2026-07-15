export default function GetStarted() {
  return (
    <section 
      className="w-full relative h-[820px] flex items-center bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: "url('/getstarted.png')" }}
    >
      <div className="absolute inset-0 bg-black/20 z-0" />

      <div className="absolute left-10 md:left-24 top-40 z-10 max-w-2xl">
        <h2 className="text-7xl font-bold text-white uppercase tracking-tight drop-shadow-lg mb-6 whitespace-nowrap">
          GET STARTED
        </h2>
        <p className="text-white text-xl leading-relaxed drop-shadow-md max-w-md">
          Kindly provide your details, and a member of our team will contact you at their earliest convenience.
        </p>
      </div>

      <div className="absolute right-0 top-0 h-full w-full md:w-1/2 z-10 bg-[#333333]/30 backdrop-blur-md p-12 md:p-24 flex flex-col justify-center">
        <div className="max-w-lg mx-auto w-full">
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <input type="text" placeholder="First name *" className="w-full p-4 bg-white/5 shadow-inner border-2 border-white text-white placeholder-white/90 outline-none focus:bg-white/10 transition-all" />
              <input type="text" placeholder="Last name *" className="w-full p-4 bg-white/5 shadow-inner border-2 border-white text-white placeholder-white/90 outline-none focus:bg-white/10 transition-all" />
            </div>
            <input type="email" placeholder="Email address *" className="w-full p-4 bg-white/5 shadow-inner border-2 border-white text-white placeholder-white/90 outline-none focus:bg-white/10 transition-all" />
            <input type="tel" placeholder="Phone number *" className="w-full p-4 bg-white/5 shadow-inner border-2 border-white text-white placeholder-white/90 outline-none focus:bg-white/10 transition-all" />
            
            <textarea placeholder="Message" rows="6" className="w-full p-4 bg-white/5 shadow-inner border-2 border-white text-white placeholder-white/90 outline-none focus:bg-white/10 transition-all" />
            
            <label className="flex items-start space-x-3 text-white/90 text-sm">
              <input type="checkbox" className="mt-1 accent-yellow-500" />
              <span>By clicking "Send now", you read and agree to our <a href="#" className="text-yellow-500 underline">Privacy Policy</a></span>
            </label>
            
            <button className="w-full bg-transparent text-white font-bold py-5 uppercase tracking-widest border-2 border-white transition-all duration-500 ease-in-out hover:bg-yellow-500 hover:text-black hover:border-yellow-500 shadow-lg">
              SEND
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}