import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Calendar, Sparkles, MessageSquare } from 'lucide-react';

const cn = (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ');

interface NavItem {
  label: string;
  type: 'hash' | 'link';
  target: string;
}

const navItems: NavItem[] = [
  { label: 'Product', type: 'hash', target: 'showcase' },
  { label: 'How It Works', type: 'hash', target: 'workflow' },
  { label: 'Solutions', type: 'hash', target: 'solutions' },
  { label: 'Pricing', type: 'hash', target: 'pricing' },
  { label: 'FAQ', type: 'hash', target: 'faq' },
  { label: 'Orders', type: 'link', target: '/orders' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
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

  const scrollToAnchor = (anchorId: string) => {
    setMobileOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(`/#${anchorId}`);
  };

  return (
    <>
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-[#E4572E] to-[#EA580C] z-[100] transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[#F5F3EF]/95 backdrop-blur-md border-b border-[#E8E4DE] shadow-sm py-2.5'
            : 'bg-transparent py-4'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 group">
              <span className="text-2xl font-black tracking-tight text-[#171717] group-hover:text-[#E4572E] transition-colors">
                FiveNest
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#E4572E] inline-block mb-1 group-hover:scale-125 transition-transform" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#EFECE6]/85 border border-[#E2DED7] shadow-sm backdrop-blur-sm">
              {navItems.map((item) => (
                item.type === 'hash' ? (
                  <button
                    key={item.label}
                    onClick={() => scrollToAnchor(item.target)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#686661] hover:text-[#171717] hover:bg-white/80 transition-all cursor-pointer"
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.label}
                    to={item.target}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#686661] hover:text-[#171717] hover:bg-white/80 transition-all"
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2.5">
              <Link
                to="/production"
                className="px-4 py-2 text-xs font-bold text-[#171717] hover:text-[#E4572E] bg-white border border-[#E2DED7] rounded-xl shadow-xs transition-all hover:bg-neutral-50"
              >
                Production Studio
              </Link>
              <button
                onClick={() => scrollToAnchor('demo')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#E4572E] hover:bg-[#D4431B] text-white font-bold text-xs rounded-xl shadow-brand hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <Calendar size={13} />
                <span>Book Live Demo</span>
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex items-center gap-2 sm:hidden">
              <button
                onClick={() => scrollToAnchor('demo')}
                className="px-3 py-1.5 bg-[#E4572E] text-white font-bold text-xs rounded-lg shadow-xs"
              >
                Book Demo
              </button>
              <button
                onClick={() => setMobileOpen(true)}
                className="w-9 h-9 rounded-xl border border-[#E2DED7] bg-white flex items-center justify-center text-[#171717] shadow-xs cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] sm:hidden"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-xs" 
              onClick={() => setMobileOpen(false)} 
            />
            
            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-[#F5F3EF] border-l border-[#E2DED7] flex flex-col p-6 shadow-2xl overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-[#E8E4DE]">
                <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-1">
                  <span className="text-xl font-black text-[#171717]">FiveNest</span>
                  <span className="w-2 h-2 rounded-full bg-[#E4572E] inline-block mb-1" />
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg border border-[#E2DED7] bg-white flex items-center justify-center text-[#171717]"
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 py-5 space-y-1.5">
                {navItems.map((item) => (
                  item.type === 'hash' ? (
                    <button
                      key={item.label}
                      onClick={() => scrollToAnchor(item.target)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-[#52525B] hover:text-[#171717] hover:bg-white transition-all cursor-pointer flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      <ArrowRight size={14} className="text-neutral-400" />
                    </button>
                  ) : (
                    <Link
                      key={item.label}
                      to={item.target}
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-[#52525B] hover:text-[#171717] hover:bg-white transition-all flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      <ArrowRight size={14} className="text-neutral-400" />
                    </Link>
                  )
                ))}

                <Link
                  to="/production"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-[#E4572E] bg-[#E4572E]/10 border border-[#E4572E]/20 transition-all flex items-center justify-between mt-2"
                >
                  <span>Production Studio</span>
                  <Sparkles size={14} className="text-[#E4572E]" />
                </Link>
              </nav>

              {/* Action Buttons */}
              <div className="pt-5 border-t border-[#E8E4DE] space-y-2.5">
                <button
                  onClick={() => scrollToAnchor('demo')}
                  className="w-full py-3 bg-[#E4572E] text-white font-bold rounded-xl shadow-brand text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar size={16} />
                  <span>Book Live Demo</span>
                </button>
                <a
                  href="https://wa.me/918879228710?text=Hi%2C%20I%27d%20like%20to%20book%20a%20live%20demo%20of%20FiveNest%20for%20my%20sportswear%20business."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600/10 border border-emerald-600/25 text-emerald-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  <MessageSquare size={14} />
                  <span>Chat on WhatsApp (+91 88792 28710)</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
