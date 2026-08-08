const Footer = () => (
  <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400">
    <div className="container mx-auto px-6 text-center">
      <a href="/" className="inline-flex items-center gap-3 text-2xl font-black text-white mb-3 hover:opacity-90 transition-opacity">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20 flex-shrink-0">
          <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
        <span>FiveNest<span className="text-cyan-400">.</span></span>
      </a>
      <p className="text-xs md:text-sm text-slate-400 mb-6 max-w-lg mx-auto">
        Complete Cloud Sublimation OS for Sportswear Manufacturers & Printing Factories.
      </p>
      
      {/* 4-Step Ecosystem Quick Links */}
      <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-xs font-bold mb-6">
        <a href="https://designs.fivenest.in" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
          <span>Step 1: Design Hub ↗</span>
        </a>
        <a href="/orders" className="hover:text-cyan-400 transition-colors">
          Step 2: Order Portal
        </a>
        <a href="/studio" className="hover:text-cyan-400 transition-colors">
          Step 3: Production Studio
        </a>
        <a href="/plugins" className="hover:text-cyan-400 transition-colors">
          Step 4: FN Plugins
        </a>
      </div>

      <div className="text-[11px] text-slate-600">
        © {new Date().getFullYear()} FiveNest India. All rights reserved. Built for sportswear sublimation units.
      </div>
    </div>
  </footer>
);

export default Footer;
