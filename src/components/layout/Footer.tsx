import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowRight, Heart } from 'lucide-react';

const productLinks = [
  { label: 'Home', to: '/' },
  { label: 'Order Management', to: '/order-management' },
  { label: 'Production Studio', to: '/production' },
  { label: 'Contact Us', to: '/contact' },
];

const companyLinks = [
  { label: 'About Us', to: '/contact' },
  { label: 'Privacy Policy', to: '/contact' },
  { label: 'Terms of Service', to: '/contact' },
  { label: 'Refund Policy', to: '/contact' },
];

export default function Footer() {
  return (
    <footer className="relative bg-[#EFECE6] border-t border-[#E2DED7] overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-10">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-1 mb-4 group">
              <span className="text-2xl font-black tracking-tight text-[#171717]">
                Fivenest
              </span>
              <span className="w-2 h-2 rounded-full bg-[#E4572E] inline-block mb-1" />
            </Link>
            <p className="text-[#686661] text-sm leading-relaxed mb-6">
              Automate your sublimation print workflow. From client orders and billing to print-ready production files.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E4572E]/10 border border-[#E4572E]/20 text-[#E4572E] text-xs font-bold uppercase tracking-wider">
              Sublimation Print Automation
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-[#171717] font-bold mb-4 text-xs uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-[#686661] text-sm font-medium hover:text-[#E4572E] transition-colors flex items-center gap-1.5 group"
                  >
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-3 group-hover:ml-0 transition-all text-[#E4572E]" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-[#171717] font-bold mb-4 text-xs uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-[#686661] text-sm font-medium hover:text-[#E4572E] transition-colors flex items-center gap-1.5 group"
                  >
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-3 group-hover:ml-0 transition-all text-[#E4572E]" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-[#171717] font-bold mb-4 text-xs uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:fivenest.india@gmail.com"
                  className="flex items-center gap-3 text-[#686661] text-sm font-medium hover:text-[#E4572E] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E2DED7] flex items-center justify-center text-[#E4572E] flex-shrink-0 group-hover:bg-[#E4572E] group-hover:text-white transition-all">
                    <Mail size={14} />
                  </div>
                  fivenest.india@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/918879228710"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[#686661] text-sm font-medium hover:text-emerald-700 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E2DED7] flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Phone size={14} />
                  </div>
                  +91 88792 28710
                </a>
              </li>
              <li>
                <div className="flex items-center gap-3 text-[#686661] text-sm font-medium">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E2DED7] flex items-center justify-center text-[#E4572E] flex-shrink-0">
                    <MapPin size={14} />
                  </div>
                  Mahim, Mumbai, India
                </div>
              </li>
            </ul>

            <a
              href="https://wa.me/918879228710?text=Hi%2C%20I%27m%20interested%20in%20Fivenest."
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/10 border border-emerald-600/25 text-emerald-700 text-xs font-bold hover:bg-emerald-600/20 transition-all"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E2DED7] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#8C8984] text-xs font-medium">
            © {new Date().getFullYear()} Fivenest. All rights reserved.
          </p>
          <p className="text-[#8C8984] text-xs font-medium flex items-center gap-1.5">
            Crafted for jersey printers in Mumbai, India
          </p>
        </div>
      </div>
    </footer>
  );
}
