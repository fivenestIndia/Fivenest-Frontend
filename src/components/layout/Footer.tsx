import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, Calendar, Sparkles } from 'lucide-react';

const productLinks = [
  { label: 'Production Studio', to: '/production' },
  { label: 'Order Management Portal', to: '/orders' },
  { label: '5-Step Factory Workflow', to: '/#workflow' },
  { label: 'Interactive Software Showcase', to: '/#showcase' },
  { label: 'Pricing & Export Tokens', to: '/#pricing' },
];

const solutionLinks = [
  { label: 'For Sportswear Manufacturers', to: '/#solutions' },
  { label: 'For Sublimation Print Shops', to: '/#solutions' },
  { label: 'For Jersey Designers', to: '/#solutions' },
  { label: 'Book Personalized Demo', to: '/#demo' },
  { label: 'New Factory ₹500 Trial', to: '/#pricing' },
];

const companyLinks = [
  { label: 'Direct Support & Contact', to: '/contact' },
  { label: '100% Duplicate Refund Policy', to: '/refund' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Data Access & Deletion', to: '/data-request' },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#EFECE6] border-t border-[#E2DED7] overflow-hidden text-[#171717]">
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-14">
          
          {/* Brand Column (4 cols) */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-1.5 mb-4 group">
              <span className="text-2xl font-black tracking-tight text-[#171717]">
                FiveNest
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#E4572E] inline-block mb-1" />
            </Link>
            
            <p className="text-[#686661] text-sm leading-relaxed mb-6 max-w-sm">
              The connected production and business workflow platform for India's sportswear manufacturers, jersey designers, and sublimation printing units.
            </p>

            <div className="space-y-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E4572E]/10 border border-[#E4572E]/20 text-[#E4572E] text-xs font-bold uppercase tracking-wider">
                <Sparkles size={13} />
                <span>From Order to Print-Ready Jersey</span>
              </div>
              <p className="text-[11px] text-[#71717A] block">
                Web-based SaaS • No heavy software installation needed • Universal RIP compatibility
              </p>
            </div>

            <a
              href="https://wa.me/918879228710?text=Hi%2C%20I%27d%20like%20to%20book%20a%20live%20demo%20of%20FiveNest%20for%20my%20sportswear%20business."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/10 border border-emerald-600/25 text-emerald-800 text-xs font-bold hover:bg-emerald-600/20 transition-all shadow-xs"
            >
              <span>Instant WhatsApp Demo (+91 88792 28710)</span>
            </a>
          </div>

          {/* Product Links (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-[#171717] font-extrabold mb-4 text-xs uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-[#686661] text-xs sm:text-sm font-medium hover:text-[#E4572E] transition-colors flex items-center gap-1 group"
                  >
                    <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#E4572E]" />
                    <span>{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions Links (2 cols) */}
          <div className="lg:col-span-3">
            <h4 className="text-[#171717] font-extrabold mb-4 text-xs uppercase tracking-wider">Solutions</h4>
            <ul className="space-y-2.5">
              {solutionLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-[#686661] text-xs sm:text-sm font-medium hover:text-[#E4572E] transition-colors flex items-center gap-1 group"
                  >
                    <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#E4572E]" />
                    <span>{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal Links (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="text-[#171717] font-extrabold mb-4 text-xs uppercase tracking-wider">Company &amp; Legal</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-[#686661] text-xs sm:text-sm font-medium hover:text-[#E4572E] transition-colors flex items-center gap-1 group"
                  >
                    <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#E4572E]" />
                    <span>{l.label}</span>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('fivenest_open_cookie_preferences'));
                    }
                  }}
                  className="text-[#686661] text-xs sm:text-sm font-medium hover:text-[#E4572E] transition-colors flex items-center gap-1 group cursor-pointer text-left"
                >
                  <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#E4572E]" />
                  <span>Cookie Preferences</span>
                </button>
              </li>
            </ul>

            {/* Direct Contact Details */}
            <div className="mt-5 pt-4 border-t border-[#E2DED7] space-y-2 text-xs text-[#686661]">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-[#E4572E] flex-shrink-0" />
                <a href="mailto:fivenest.india@gmail.com" className="hover:underline">fivenest.india@gmail.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-emerald-600 flex-shrink-0" />
                <a href="tel:+918879228710" className="hover:underline">+91 88792 28710</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-[#E4572E] flex-shrink-0" />
                <span>Mahim, Mumbai, Maharashtra 400016, India</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="border-t border-[#E2DED7] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <p>© {new Date().getFullYear()} FiveNest Technologies. All rights reserved.</p>
          <div className="flex items-center gap-2 font-bold text-[#E4572E] bg-white px-3 py-1 rounded-full border border-[#E2DED7] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Production Studio &amp; Order Ledgers Active</span>
          </div>
          <p className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Industrial 300 DPI RGB Quality Standards</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
