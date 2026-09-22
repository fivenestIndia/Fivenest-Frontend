import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Zap, Package, Settings, Users, Clock, CheckCircle, 
  Star, ChevronDown, Play, BarChart3, FileText, Wallet, Shield, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VideoScrollAnimation from '../components/VideoScrollAnimation';

// ─── Utility ───────────────────────────────────────────────────────────────
const cn = (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ');

// ─── Animated Counter ───────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) setHasStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const end = target;
    const duration = 1800;
    const step = (end / duration) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─── Feature Card ────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay = 0 }: { icon: React.ReactNode; title: string; desc: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="card-clean p-6 group cursor-default relative overflow-hidden"
    >
      <div className="w-12 h-12 rounded-xl bg-[#E4572E]/10 border border-[#E4572E]/20 flex items-center justify-center mb-4 text-[#E4572E] group-hover:bg-[#E4572E] group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-[#171717] font-bold text-lg mb-2 group-hover:text-[#E4572E] transition-colors">{title}</h3>
      <p className="text-[#52525B] text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ─── Step Card ───────────────────────────────────────────────────────────────
function StepCard({ number, title, desc, delay = 0 }: { number: string; title: string; desc: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="flex gap-5 items-start"
    >
      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#E4572E] flex items-center justify-center text-white font-black text-lg shadow-sm">
        {number}
      </div>
      <div>
        <h3 className="text-[#171717] font-bold text-lg mb-1.5">{title}</h3>
        <p className="text-[#52525B] text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Testimonials ───────────────────────────────────────────────────────────
const testimonials = [
  { name: 'Rajesh Sharma', role: 'Jersey Manufacturer, Delhi', quote: 'Fivenest reduced our production prep time from 3 hours to 15 minutes. It is an absolute game-changer for tournament orders.' },
  { name: 'Priya Patel', role: 'Sublimation Studio, Ahmedabad', quote: 'The automatic name-number replacement handles 500 jerseys in seconds with zero alignment mistakes.' },
  { name: 'Mohammed Shaikh', role: 'Sports Apparel Supplier, Mumbai', quote: 'The order portal is seamless. Clients submit team sizes and names, and invoices are generated automatically.' },
  { name: 'Sunita Verma', role: 'Print Shop Owner, Pune', quote: 'Token wallet is brilliant — we only pay for what we process. The subscription has saved us countless late nights.' },
  { name: 'Arun Kumar', role: 'Cricket Kit Manufacturer, Surat', quote: 'Processing tournament squads used to take days in Photoshop. With Fivenest Production Studio, we are done in under an hour.' },
  { name: 'Deepika Nair', role: 'Uniform Maker, Bangalore', quote: 'Automated GST billing plus print-ready file exports in one single dashboard. Cannot imagine running without it.' },
];

// ─── Pricing Card ─────────────────────────────────────────────────────────────
function PricingCard({
  name, price, portalCost, walletAmount, features, popular, delay,
}: {
  name: string; price: string; portalCost: string; walletAmount: string; features: string[]; popular?: boolean; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'relative rounded-2xl p-8 transition-all duration-300 flex flex-col',
        popular
          ? 'bg-white border-2 border-[#E4572E] shadow-soft-lg ring-4 ring-[#E4572E]/10'
          : 'bg-white border border-[#E8E4DE] shadow-soft hover:border-[#D8D5CF]'
      )}
    >
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#E4572E] rounded-full text-white text-xs font-bold tracking-wider uppercase shadow-sm">
          MOST POPULAR
        </div>
      )}

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">{name}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl lg:text-5xl font-black text-[#171717]">₹{price}</span>
          <span className="text-sm font-semibold text-[#71717A]">/month</span>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-[#F5F3EF] border border-[#E8E4DE] space-y-2.5">
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#52525B] font-medium">Order Portal</span>
          <span className="text-[#171717] font-bold">{portalCost}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#52525B] font-medium">Wallet Tokens</span>
          <span className="text-[#E4572E] font-bold">{walletAmount}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-3 text-sm text-[#52525B]">
            <CheckCircle className="w-4 h-4 text-[#E4572E] flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/contact"
        className={cn(
          'w-full py-3.5 rounded-xl font-bold text-center text-sm transition-all duration-200 block',
          popular
            ? 'bg-[#E4572E] hover:bg-[#D4431B] text-white shadow-brand hover:shadow-brand-lg'
            : 'bg-[#F5F3EF] hover:bg-[#EFECE6] text-[#171717] border border-[#E2DED7]'
        )}
      >
        Get Started
      </Link>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState<'order' | 'production'>('order');

  const orderFeatures = [
    { icon: <Package size={22} />, title: 'Smart Order Creation', desc: 'Create manufacturing orders with player details, sizes, quantities, and designs in seconds.' },
    { icon: <FileText size={22} />, title: 'Auto Billing & Invoicing', desc: 'Generate GST-ready tax invoices automatically. Track payments and outstanding balances with ease.' },
    { icon: <Users size={22} />, title: 'Dedicated Client Portal', desc: 'Clients get a dedicated branded portal to submit orders, track progress, and download invoices.' },
    { icon: <BarChart3 size={22} />, title: 'Real-time Dashboard', desc: 'Live overview of all manufacturing orders, statuses, revenue, and active production queue.' },
    { icon: <Shield size={22} />, title: 'Subscription Gated Access', desc: 'Secure client portal with subscription-based access and automatic token wallet credit.' },
    { icon: <Wallet size={22} />, title: 'Integrated Token Wallet', desc: 'Wallet tokens unlock automated production file exports — pay only for what you actually produce.' },
  ];

  const productionFeatures = [
    { icon: <Zap size={22} />, title: 'Automated Resizing', desc: 'Instantly resize master jersey artwork to exact print specifications for any size from XS to 5XL.' },
    { icon: <Settings size={22} />, title: 'Name & Number Replace', desc: 'Batch replace player names and numbers across hundreds of files in one single click.' },
    { icon: <Clock size={22} />, title: '70% Manual Time Saved', desc: 'What took your design team 4 hours now completes in under 20 minutes with zero rework.' },
    { icon: <FileText size={22} />, title: 'Print-Ready Exports', desc: 'Files exported at correct DPI, color profile, and format for seamless loading into RIP software.' },
    { icon: <CheckCircle size={22} />, title: 'Quality Validation Checks', desc: 'Automatic validation ensures no missing players, duplicate numbers, or misaligned chest prints.' },
    { icon: <Package size={22} />, title: 'High-Volume Batch Runs', desc: 'Handle 500+ jerseys in a single production run with neatly organized file folders by size.' },
  ];

  return (
    <div className="relative bg-[#F5F3EF]" style={{ overflowX: 'clip' }}>

      {/* ── HERO SECTION MATCHING https://www.fivenest.in ────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Technical CAD Grid Background */}
        <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute inset-0 hero-radial pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          
          {/* Pill Badge from screenshot: PRODUCTION AUTOMATION SOFTWARE */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-8"
          >
            <span className="badge-pill">
              <Sparkles size={13} className="text-[#E4572E]" />
              Production Automation Software
            </span>
          </motion.div>

          {/* Headline matching screenshot:
              "Automate Your" (Black)
              "Sublimation" (Terracotta Orange)
              "Print Workflow" (Black)
          */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-hero mb-6"
          >
            Automate Your<br />
            <span className="text-[#E4572E]">Sublimation</span> Print<br className="hidden sm:inline" /> Workflow
          </motion.h1>

          {/* Subtitle from screenshot */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-section-subtitle mx-auto mb-10 text-center"
          >
            Process hundreds of files instantly with automated resizing, renaming and export. Built for high-volume jersey printing manufacturers.
          </motion.p>

          {/* Buttons from screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Link
              to="/contact"
              className="btn-primary w-full sm:w-auto"
            >
              👉 Start 7-Day Free Trial
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary w-full sm:w-auto"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Stats Bar matching screenshot:
              1000+ FILES PROCESSED PER RUN
              70% MANUAL TIME SAVED
              3x FASTER PRODUCTION OUTPUT
          */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto pt-10 border-t border-[#E8E4DE]"
          >
            <div className="text-center">
              <p className="text-4xl lg:text-5xl font-black text-[#E4572E] mb-1">
                <AnimatedCounter target={1000} suffix="+" />
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Files Processed Per Run
              </p>
            </div>

            <div className="text-center">
              <p className="text-4xl lg:text-5xl font-black text-[#E4572E] mb-1">
                <AnimatedCounter target={70} suffix="%" />
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Manual Time Saved
              </p>
            </div>

            <div className="text-center">
              <p className="text-4xl lg:text-5xl font-black text-[#E4572E] mb-1">
                3x
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Faster Production Output
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── 3D JERSEY VIDEO SCROLL SHOWCASE (CINEMATIC STUDIO) ──────── */}
      <section className="relative">
        <VideoScrollAnimation src="/jersey-3d.mp4" scrollHeight="450vh" />
      </section>

      {/* ── PROBLEM SECTION ────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#EFECE6]/60 border-y border-[#E8E4DE]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge-pill mb-4 inline-block">
              The Production Bottleneck
            </span>
            <h2 className="text-section-title mb-4">
              Manual jersey workflows are <br className="hidden sm:inline" />
              <span className="text-[#E4572E]">costing your print shop hours</span> every single day
            </h2>
            <p className="text-section-subtitle mx-auto">
              Sublimation printers lose hours daily to repetitive tasks in Photoshop and Illustrator that software can execute in seconds.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: '⏱️', title: '4+ Hours Wasted', desc: 'Opening Photoshop, nudging layers, editing player names, resizing files manually for every single size in a squad.' },
              { emoji: '📄', title: 'Billing & Order Chaos', desc: 'Tracking order specs over WhatsApp voice notes and disorganized spreadsheets leads to missing sizes and payment disputes.' },
              { emoji: '📞', title: 'Constant Follow-ups', desc: 'Clients with no visibility into production status call multiple times daily asking when their tournament kits will ship.' },
            ].map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="card-clean p-8 text-center"
              >
                <div className="text-4xl mb-4">{p.emoji}</div>
                <h3 className="text-xl font-bold text-[#171717] mb-3">{p.title}</h3>
                <p className="text-[#52525B] text-sm leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES TABS ──────────────────────────────────────────── */}
      <section className="py-24 relative" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="badge-pill mb-4 inline-block">
              Platform Features
            </span>
            <h2 className="text-section-title mb-4">
              Two powerful tools, <span className="text-[#E4572E]">one unified platform</span>
            </h2>
            <p className="text-section-subtitle mx-auto">
              Choose the automation system you need — or utilize both for complete end-to-end manufacturing flow.
            </p>
          </motion.div>

          {/* Pill Tab Switcher */}
          <div className="flex justify-center mb-12">
            <div className="flex p-1.5 rounded-full bg-[#EFECE6] border border-[#E2DED7] shadow-sm">
              {(['order', 'production'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200',
                    activeTab === tab
                      ? 'bg-white text-[#171717] shadow-sm'
                      : 'text-[#686661] hover:text-[#171717]'
                  )}
                >
                  {tab === 'order' ? '📦 Order Management' : '⚡ Production Studio'}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'order' ? orderFeatures : productionFeatures).map((f, i) => (
                  <FeatureCard key={f.title} {...f} delay={i * 0.05} />
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  to={activeTab === 'order' ? '/order-management' : '/production'}
                  className="btn-secondary"
                >
                  Explore {activeTab === 'order' ? 'Order Management' : 'Production Studio'}
                  <ArrowRight size={16} className="text-[#E4572E]" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#EFECE6]/40 border-t border-[#E8E4DE]" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <span className="badge-pill mb-4 inline-block">
                  Automated Workflow
                </span>
                <h2 className="text-section-title mb-4">
                  From client order to <br />
                  <span className="text-[#E4572E]">print-ready files in minutes</span>
                </h2>
                <p className="text-section-subtitle mb-10">
                  A seamless 4-step pipeline that collects details from your customer and outputs production-ready files without manual layer adjustments.
                </p>
              </motion.div>

              <div className="space-y-7">
                {[
                  { n: '1', t: 'Client Places Order via Portal', d: 'Customer logs into their dedicated portal, inputs team roster, player names, numbers, sizes, and attaches logo artwork.' },
                  { n: '2', t: 'GST Invoice Auto-Generated', d: 'The system automatically issues a GST-compliant tax invoice, deducts wallet balance, or sends instant payment links.' },
                  { n: '3', t: 'Production Studio Processes Files', d: 'With one click, files are resized across sizes (XS to 5XL) and custom names and numbers are placed in vector precision.' },
                  { n: '4', t: 'Download Print-Ready Output', d: 'Download your zip folder organized by player and garment size, ready to feed straight into your RIP software.' },
                ].map((step, i) => (
                  <StepCard key={step.n} number={step.n} title={step.t} desc={step.d} delay={i * 0.08} />
                ))}
              </div>
            </div>

            {/* Visual SaaS Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="card-clean p-6 shadow-soft-lg border border-[#E2DED7]"
            >
              {/* Fake browser bar */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E8E4DE]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-semibold text-[#8C8984]">app.fivenest.in/orders</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Live System
                </span>
              </div>

              {/* Order Rows */}
              <div className="space-y-3 mb-6">
                {[
                  { id: '#FN-2401', team: 'Mumbai Warriors FC', count: 22, status: 'Production', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { id: '#FN-2402', team: 'Delhi Tigers CC', count: 16, status: 'Billing Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { id: '#FN-2403', team: 'Chennai Super Strikers', count: 30, status: 'Files Ready', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { id: '#FN-2404', team: 'Pune Falcons Basketball', count: 18, status: 'Processing', color: 'bg-orange-50 text-[#E4572E] border-orange-200' },
                ].map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E8E4DE]"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#8C8984]">{order.id}</p>
                      <p className="text-sm font-bold text-[#171717]">{order.team}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-[#71717A] mb-1">{order.count} Jerseys</p>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${order.color}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stat metric pills */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: 'Weekly Revenue', value: '₹2.4 Lakh' },
                  { label: 'Active Jobs', value: '14 Orders' },
                  { label: 'Files Exported', value: '862 Files' },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E8E4DE] text-center">
                    <p className="text-base font-black text-[#171717]">{s.value}</p>
                    <p className="text-[11px] font-semibold text-[#71717A] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS MARQUEE ───────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-14 text-center">
          <span className="badge-pill mb-4 inline-block">
            Trusted by Print Shops
          </span>
          <h2 className="text-section-title mb-3">
            Loved by jersey printers across India
          </h2>
          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} className="text-amber-500 fill-amber-500" />
            ))}
            <span className="text-sm font-bold text-[#171717] ml-2">4.9/5 from 200+ active manufacturers</span>
          </div>
        </div>

        {/* Infinite Marquee */}
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_8%,white_92%,transparent)]">
          <div className="animate-marquee gap-6 py-2">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-84 p-6 rounded-2xl bg-white border border-[#E8E4DE] shadow-soft flex flex-col justify-between"
                style={{ width: '340px' }}
              >
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={13} className="text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-[#52525B] text-sm leading-relaxed mb-6">"{t.quote}"</p>
                </div>
                <div className="pt-4 border-t border-[#E8E4DE]">
                  <p className="text-[#171717] font-bold text-sm">{t.name}</p>
                  <p className="text-[#71717A] text-xs mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#EFECE6]/50 border-t border-[#E8E4DE]" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge-pill mb-4 inline-block">
              Transparent Pricing
            </span>
            <h2 className="text-section-title mb-4">
              Simple subscription plans with <br />
              <span className="text-[#E4572E]">included production wallet balance</span>
            </h2>
            <p className="text-section-subtitle mx-auto">
              Every plan includes full order management plus token balance for Production Studio file generations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            <PricingCard
              name="Starter Plan"
              price="1,000"
              portalCost="₹500 / month"
              walletAmount="₹500 wallet tokens"
              delay={0}
              features={[
                'Full Order Management Portal',
                '₹500 Production Studio token balance',
                'Up to 50 client orders/month',
                'Standard GST tax invoices',
                'Email and WhatsApp support',
              ]}
            />

            <PricingCard
              name="Professional Plan"
              price="2,500"
              portalCost="₹300 / month"
              walletAmount="₹2,000 wallet tokens"
              popular
              delay={0.1}
              features={[
                'Full Order Management Portal',
                '₹2,000 Production Studio token balance',
                'Unlimited client orders per month',
                'Custom GST invoicing & auto-dispatch',
                'Dedicated client login accounts',
                'Priority WhatsApp assistance',
              ]}
            />

            <PricingCard
              name="Enterprise Plan"
              price="5,000"
              portalCost="FREE Included"
              walletAmount="₹5,000 wallet tokens"
              delay={0.2}
              features={[
                'FREE Unlimited Order Management Portal',
                '₹5,000 Production Studio token balance',
                'Unlimited client portals & orders',
                'Full team multi-login accounts',
                'Direct phone & dedicated manager',
                'Custom export format integrations',
              ]}
            />
          </div>

          {/* Token explanation banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-14 p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E4DE] shadow-soft max-w-3xl mx-auto text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-[#E4572E]/10 flex items-center justify-center mx-auto mb-4 text-[#E4572E]">
              <Wallet size={24} />
            </div>
            <h3 className="text-[#171717] font-bold text-lg mb-2">How Does the Token Wallet Work?</h3>
            <p className="text-[#52525B] text-sm leading-relaxed max-w-xl mx-auto mb-4">
              Your monthly subscription automatically credits tokens directly to your wallet. Each jersey file processed consumes tokens (~₹4 per customized jersey). Unused tokens roll over every month with an active subscription.
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F3EF] border border-[#E8E4DE] text-xs font-bold text-[#171717]">
              Need more tokens? Top up anytime directly from your dashboard
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── BOTTOM CTA BANNER ──────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden bg-[#171717] text-white">
        <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-orange-400 border border-white/15 mb-6">
              Start Automating Today
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Ready to eliminate jersey printing <br />
              <span className="text-[#E4572E]">headaches forever?</span>
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Join leading sublimation printing manufacturers saving hundreds of hours each month with Fivenest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="btn-primary py-4 px-8 text-base shadow-brand-lg"
              >
                Start 7-Day Free Trial <ArrowRight size={18} />
              </Link>
              <Link
                to="/order-management"
                className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/15 py-4 px-8 text-base"
              >
                Explore Order Management
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
