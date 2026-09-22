import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';

const cn = (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ');

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Order Management', to: '/order-management' },
  { label: 'Production', to: '/production' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(scrollTop > 20);
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-[#E4572E] z-[100] transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[#F5F3EF]/90 backdrop-blur-md border-b border-[#E8E4DE] shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo matching https://www.fivenest.in */}
            <Link to="/" className="flex items-center gap-1 group">
              <span className="text-2xl font-black tracking-tight text-[#171717]">
                Fivenest
              </span>
              <span className="w-2 h-2 rounded-full bg-[#E4572E] inline-block mb-1 group-hover:scale-125 transition-transform" />
            </Link>

            {/* Desktop Center Pill Nav */}
            <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-full bg-[#EFECE6]/80 border border-[#E2DED7] shadow-sm backdrop-blur-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'relative px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200',
                    isActive(link.to)
                      ? 'text-[#171717] bg-white shadow-sm'
                      : 'text-[#686661] hover:text-[#171717]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/production"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#E4572E] hover:bg-[#D4431B] text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-brand hover:-translate-y-0.5 active:translate-y-0"
              >
                Launch Production Studio <ArrowRight size={14} />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-10 h-10 rounded-xl border border-[#E2DED7] bg-white flex items-center justify-center text-[#171717] shadow-sm"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] md:hidden"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-[#F5F3EF] border-l border-[#E2DED7] flex flex-col p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-[#E8E4DE]">
                <Link to="/" className="flex items-center gap-1">
                  <span className="text-xl font-black text-[#171717]">Fivenest</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E4572E] inline-block mb-1" />
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-xl border border-[#E2DED7] bg-white flex items-center justify-center text-[#171717]"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Links */}
              <nav className="flex-1 py-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition-all',
                      isActive(link.to)
                        ? 'bg-white text-[#E4572E] border border-[#E2DED7] shadow-sm'
                        : 'text-[#52525B] hover:bg-white/60 hover:text-[#171717]'
                    )}
                  >
                    {link.label}
                    {isActive(link.to) && <span className="w-2 h-2 rounded-full bg-[#E4572E]" />}
                  </Link>
                ))}
              </nav>

              {/* Bottom CTA */}
              <div className="pt-6 border-t border-[#E8E4DE] space-y-3">
                <Link
                  to="/production"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#E4572E] text-white font-bold rounded-xl shadow-brand"
                >
                  Launch Production Studio <ArrowRight size={16} />
                </Link>
                <a
                  href="https://wa.me/918879228710"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600/10 border border-emerald-600/20 text-emerald-700 font-semibold rounded-xl text-sm"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
