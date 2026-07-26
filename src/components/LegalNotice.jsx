import React from 'react';
import { Link } from 'react-router-dom';

export default function LegalNotice() {
  return (
    <div className="min-h-screen bg-[#050505] tech-grid text-white py-16 px-6">
      <div className="max-w-4xl mx-auto bg-[#0e0c0b]/90 border border-white/10 p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        <span className="text-yellow-500 font-mono text-xs uppercase tracking-widest block mb-2">Legal & Compliance</span>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-6">Privacy Policy</h1>
        
        <div className="space-y-6 text-white/70 text-sm leading-relaxed border-t border-white/10 pt-6">
          <p className="font-mono text-xs text-yellow-500/80">
            Last Updated: July 2026
          </p>

          <p>
            Welcome to <strong className="text-white">JB Logistics</strong>. We respect your privacy and are committed to maintaining full transparency regarding how we handle information on our platform. 
          </p>

          <h2 className="text-lg font-bold text-white uppercase tracking-wider pt-4">1. Data Collection Overview</h2>
          <p>
            At this stage of development, JB Logistics <strong className="text-white">does not actively collect, store, or process personal user data</strong> for marketing, profiling, or commercial resale. You can navigate our public pages, review ground freight options, and track shipments without creating a permanent user profile or surrendering personal details.
          </p>

          <h2 className="text-lg font-bold text-white uppercase tracking-wider pt-4">2. Quotes, Tracking, and Operational Inputs</h2>
          <p>
            If you submit shipment tracking numbers or interact with specific dispatch and quote features, those inputs are processed strictly for the real-time execution of your logistics request. We do not harvest these inputs for unauthorized third-party sharing.
          </p>

          <h2 className="text-lg font-bold text-white uppercase tracking-wider pt-4">3. Cookies and Local Storage</h2>
          <p>
            Our website utilizes minimal local storage or session mechanisms strictly necessary for core application functionality (such as managing secure administrator authentication sessions or UI preferences). We do not deploy aggressive third-party advertising tracking cookies.
          </p>

          <h2 className="text-lg font-bold text-white uppercase tracking-wider pt-4">4. Future Policy Updates</h2>
          <p>
            As our logistics network expands and introduces new interactive features, user accounts, or automated customer portals, this privacy policy will be updated accordingly to reflect any changes in data handling practices.
          </p>

          <h2 className="text-lg font-bold text-white uppercase tracking-wider pt-4">5. Contact Information</h2>
          <p>
            If you have any questions or concerns regarding our privacy practices or this policy, you can reach out directly through our main operations channels.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10">
          <Link to="/" className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-wider px-6 py-3 text-xs transition-all">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}