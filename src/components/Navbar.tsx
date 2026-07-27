import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Wallet, Plus, ShieldCheck, Palette, Package } from "lucide-react";

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
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Production Studio", href: "/studio", isRoute: true },
    { name: "Order Portal", href: "/orders", isRoute: true },
    { name: "Case Studies", href: "/#case-studies" },
    { name: "Academy", href: "/academy", isRoute: true },
    { name: "Wallet Pricing", href: "/#pricing" },
    { name: "FAQ", href: "/#faq" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-4 transition-all duration-300">
      <div
        className={`container mx-auto max-w-6xl rounded-full transition-all duration-300 ${
          scrolled
            ? "bg-slate-950/90 border border-slate-800/90 backdrop-blur-2xl shadow-2xl py-2.5 px-5 md:px-7"
            : "bg-slate-950/60 border border-slate-800/60 backdrop-blur-xl py-3 px-5 md:px-7"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <img src="/logo.svg" alt="FiveNest" className="w-5 h-5 object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white text-lg tracking-tight leading-none">
                FiveNest
              </span>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest leading-tight mt-0.5">
                Cloud OS
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-300">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`hover:text-cyan-400 transition-all ${
                    location.pathname === link.href ? "text-cyan-400 font-extrabold" : ""
                  }`}
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="hover:text-cyan-400 transition-all"
                >
                  {link.name}
                </a>
              )
            )}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link to="/orders" className="hidden sm:block">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 px-4 py-2 rounded-full text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-md">
                <Package size={14} className="text-cyan-400" />
                <span>Orders Portal</span>
              </div>
            </Link>

            <Link to="/studio">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                <Palette size={14} />
                <span>Production Studio</span>
              </motion.button>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
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
            className="lg:hidden mt-3 container mx-auto max-w-md rounded-3xl bg-slate-950/95 border border-slate-800 p-6 backdrop-blur-2xl shadow-2xl"
          >
            <div className="flex flex-col gap-4 text-sm font-semibold text-slate-300">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-cyan-400 transition-colors py-1"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-cyan-400 transition-colors py-1"
                  >
                    {link.name}
                  </a>
                )
              )}

              <div className="pt-2 space-y-2">
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2">
                    <Package size={16} className="text-cyan-400" />
                    <span>Open Orders Portal (/orders)</span>
                  </button>
                </Link>

                <Link to="/studio" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
                    <Palette size={16} />
                    <span>Open Production Studio (/studio)</span>
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
