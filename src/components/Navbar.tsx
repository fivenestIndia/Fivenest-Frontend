import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ExternalLink, Palette, Package, Sliders, Cpu, Sparkles } from "lucide-react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Design Hub ↗", href: "https://designs.fivenest.in", isExternal: true, step: "Step 1" },
    { name: "Order Portal", href: "/orders", isRoute: true, step: "Step 2" },
    { name: "Production Studio", href: "/studio", isRoute: true, step: "Step 3" },
    { name: "FN Plugins", href: "/plugins", isRoute: true, step: "Step 4" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3.5 transition-all duration-300">
      <div
        className={`container mx-auto max-w-6xl rounded-full transition-all duration-300 ${
          scrolled
            ? "bg-slate-950/90 border border-slate-800/90 backdrop-blur-2xl shadow-2xl py-2.5 px-5 md:px-7"
            : "bg-slate-950/70 border border-slate-800/70 backdrop-blur-xl py-3 px-5 md:px-7"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Main Logo & Brand Style */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* Glowing 3D Brand Badge */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-400/50 group-hover:scale-105 transition-all duration-300 flex-shrink-0">
              <div className="w-full h-full rounded-[14.5px] bg-slate-950 flex items-center justify-center relative overflow-hidden">
                {/* Background inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 opacity-80 group-hover:opacity-100 transition-opacity" />
                {/* Custom Geometric Sportswear Layer Logo */}
                <svg className="w-5 h-5 relative z-10 text-cyan-300 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-black text-white text-xl tracking-tight leading-none group-hover:text-cyan-300 transition-colors">
                  FiveNest
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
              </div>
              <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-[0.2em] leading-tight mt-0.5">
                PRODUCTION OS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links - Centered & Aligned */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return link.isExternal ? (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full text-xs font-extrabold text-cyan-300 hover:text-white hover:bg-cyan-500/20 border border-transparent hover:border-cyan-500/30 transition-all flex items-center gap-1.5"
                >
                  <span>{link.name}</span>
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold shadow-md shadow-cyan-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://designs.fivenest.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 px-4 py-2 rounded-full text-xs font-extrabold text-cyan-300 transition-all cursor-pointer shadow-sm hover:shadow-cyan-500/10"
            >
              <Palette size={13} className="text-cyan-400" />
              <span>Design Hub</span>
              <ExternalLink size={11} />
            </a>

            <Link to="/studio">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                <Sliders size={14} />
                <span>Production Studio</span>
              </motion.button>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-3 container mx-auto max-w-md rounded-3xl bg-slate-950/95 border border-slate-800 p-6 backdrop-blur-2xl shadow-2xl"
          >
            <div className="flex flex-col gap-3 text-sm font-semibold text-slate-300">
              <a
                href="https://designs.fivenest.in"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Palette size={16} />
                  <span>Step 1: Open Design Hub</span>
                </div>
                <ExternalLink size={14} />
              </a>

              <Link to="/orders" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2">
                  <Package size={16} className="text-cyan-400" />
                  <span>Step 2: Order Portal (/orders)</span>
                </button>
              </Link>

              <Link to="/studio" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                  <Sliders size={16} />
                  <span>Step 3: Production Studio (/studio)</span>
                </button>
              </Link>

              <Link to="/plugins" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 text-purple-300 font-bold text-xs flex items-center gap-2">
                  <Cpu size={16} />
                  <span>Step 4: Desktop Plugins (/plugins)</span>
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
