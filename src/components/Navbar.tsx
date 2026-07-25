import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Sparkles, BookOpen } from "lucide-react";

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
    { name: "Workflow Comparison", href: "/#before-after" },
    { name: "Demo Video", href: "/#workflow-demo" },
    { name: "Software Showcase", href: "/#dashboard-showcase" },
    { name: "Case Studies", href: "/#case-studies" },
    { name: "Academy", href: "/academy", isRoute: true },
    { name: "Pricing", href: "/#pricing" },
    { name: "30+ FAQ", href: "/#faq" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 transition-all duration-300">
      <div
        className={`container mx-auto max-w-6xl rounded-full transition-all duration-300 ${
          scrolled
            ? "bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl py-3 px-6"
            : "bg-slate-950/40 border border-white/10 backdrop-blur-md py-3.5 px-6"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                <img src="/logo.svg" alt="FiveNest" className="w-5 h-5 object-contain" />
              </div>
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">
              FiveNest <span className="text-cyan-400 text-xs uppercase tracking-widest font-mono">Web</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`hover:text-cyan-400 transition-colors ${
                    location.pathname === link.href ? "text-cyan-400 font-bold" : ""
                  }`}
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="hover:text-cyan-400 transition-colors"
                >
                  {link.name}
                </a>
              )
            )}
          </nav>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link to="/studio" className="hidden sm:block">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <span>Launch Web Studio</span>
                <ArrowRight size={14} />
              </motion.button>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white"
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
            className="md:hidden mt-3 container mx-auto max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 backdrop-blur-2xl shadow-2xl"
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

              <Link to="/studio" onClick={() => setMobileMenuOpen(false)} className="pt-2">
                <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
                  <span>Launch Web Studio</span>
                  <ArrowRight size={14} />
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
