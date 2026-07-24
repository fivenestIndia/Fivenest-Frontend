import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
  { href: "/studio", label: "Web Studio", highlight: true },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div
          className={`flex items-center justify-between px-5 py-2.5 rounded-2xl transition-all duration-300 ${
            scrolled
              ? "bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-cyan-500/5"
              : "bg-transparent border border-transparent"
          }`}
        >
          <a href="/" className="flex items-center gap-2 text-xl md:text-2xl font-black tracking-tight z-50">
            <img src="/logo.svg" alt="Fivenest Logo" className="h-8 md:h-9 w-auto object-contain" />
            <span className="bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              FiveNest<span className="text-cyan-400">.</span>
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-all duration-200 hover:text-cyan-400 relative py-1 ${
                  l.highlight
                    ? "text-cyan-400 font-semibold px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20"
                    : "text-slate-300"
                }`}
              >
                {l.label}
              </a>
            ))}
            
            <Link to="/studio">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(10, 203, 249, 0.5)" }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-black text-sm font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Sparkles size={16} />
                Launch Studio
                <ArrowRight size={14} />
              </motion.button>
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden z-50 p-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Mobile Animated Menu Overlay */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/90 z-40 flex flex-col items-center justify-center p-6 md:hidden"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
                >
                  {navLinks.map((l, i) => (
                    <motion.a
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.08 }}
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className={`text-xl font-bold transition-colors ${
                        l.highlight ? "text-cyan-400" : "text-slate-200"
                      }`}
                    >
                      {l.label}
                    </motion.a>
                  ))}

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-full pt-4 border-t border-white/10 mt-2"
                  >
                    <Link to="/studio" onClick={() => setOpen(false)} className="w-full block">
                      <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25">
                        <Sparkles size={18} />
                        Launch Web Studio
                        <ArrowRight size={16} />
                      </button>
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
