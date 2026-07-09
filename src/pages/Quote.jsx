import { useState } from "react";
import { Calculator, User, MapPin, Package, ArrowRight } from "lucide-react";

export default function Quote() {
  const [formData, setFormData] = useState({
    sName: "", sLoc: "", rName: "", rLoc: "", weight: ""
  });
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateQuote = (e) => {
    e.preventDefault();
    const price = parseFloat(formData.weight) * 5; // Example logic
    setResult(price.toFixed(2));
  };

  return (
    <div className="pt-32 px-5 max-w-4xl mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <Calculator className="text-blue-500" />
        <h1 className="text-3xl font-black">Shipment Quote Calculator</h1>
      </div>

      <form onSubmit={calculateQuote} className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl space-y-8">
        
        {/* Two-Column Grid for Sender and Receiver */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Sender Side */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-bold text-slate-400 text-sm uppercase">
              <User size={16} /> Sender Details
            </h3>
            <input name="sName" placeholder="Sender Name" onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
            <input name="sLoc" placeholder="Origin City/Location" onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
          </div>

          {/* Receiver Side */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-bold text-slate-400 text-sm uppercase">
              <MapPin size={16} /> Receiver Details
            </h3>
            <input name="rName" placeholder="Receiver Name" onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
            <input name="rLoc" placeholder="Destination City/Location" onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm" />
          </div>
        </div>

        {/* Bottom Section: Weight and Submit */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Package Weight (kg)</label>
            <input
              name="weight"
              type="number"
              placeholder="0.00"
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <button type="submit" className="bg-blue-600 px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors w-full md:w-auto">
            Calculate <ArrowRight size={16} />
          </button>
        </div>
      </form>

      {/* Result Display */}
      {result && (
        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Total Estimated Cost</p>
          <p className="text-4xl font-black mt-2">${result}</p>
        </div>
      )}
    </div>
  );
}