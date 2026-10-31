import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Zap, Package, Settings, Users, Clock, CheckCircle, 
  Star, ChevronDown, ChevronRight, Play, BarChart3, FileText, Wallet, 
  Shield, Sparkles, Layers, Sliders, Scissors, Printer, Download,
  TrendingUp, Award, HelpCircle, Check, ArrowUpRight, Flame, Laptop
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { SUBSCRIPTION_PLANS, DEFAULT_SPOT_RATE_WITH_TAG, DEFAULT_SPOT_RATE_WITHOUT_TAG } from '../lib/subscriptionPlans';

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

export default function Home() {
  // Sandbox preview switcher: 'production' | 'orders'
  const [activeSandboxTab, setActiveSandboxTab] = useState<'production' | 'orders'>('production');

  // Interactive 3-step production simulator state
  const [prodStep, setProdStep] = useState<1 | 2 | 3>(1);
  const [selectedSport, setSelectedSport] = useState<'cricket' | 'football' | 'kabaddi' | 'esports'>('cricket');
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('L');
  const [rollWidth, setRollWidth] = useState<'44"' | '60"' | '72"'>('60"');

  // Savings Calculator State
  const [monthlyJerseys, setMonthlyJerseys] = useState<number>(600);

  // Pricing Matrix Tab: 'monthly' | 'quarterly' | 'spot'
  const [pricingTab, setPricingTab] = useState<'monthly' | 'quarterly' | 'spot'>('monthly');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Dynamic calculations for ROI calculator
  const manualHours = Math.round((monthlyJerseys * 12) / 60);
  const fivenestHours = Math.round((monthlyJerseys * 0.4) / 60) || 1;
  const hoursSaved = manualHours - fivenestHours;
  const designerCost = Math.round(monthlyJerseys * 35); // ₹35 per jersey manual labor cost
  const fivenestCost = Math.round(monthlyJerseys * 2.75); // FiveNest automated cost
  const moneySaved = Math.max(0, designerCost - fivenestCost);
  const fabricSavedMeters = Math.round((monthlyJerseys * 1.3) * 0.12); // ~12% fabric waste reduction

  const sportsConfigs = {
    cricket: { name: 'Cricket Pro Kit', pattern: 'Diagonal Sublimation Hex', number: '18', player: 'V. KOHLI', accent: '#E4572E' },
    football: { name: 'Football Aero Fit', pattern: 'Dynamic Motion Stripes', number: '10', player: 'MESSI', accent: '#3B82F6' },
    kabaddi: { name: 'Kabaddi Warrior', pattern: 'Bold Tribal Combat', number: '07', player: 'PAWAN', accent: '#10B981' },
    esports: { name: 'Esports Cyber Armor', pattern: 'Geometric Cyber Pulse', number: '99', player: 'PHANTOM', accent: '#8B5CF6' },
  };

  return (
    <div className="relative min-h-screen bg-[#F5F3EF] text-[#171717] font-sans selection:bg-[#E4572E] selection:text-white overflow-x-clip">
      {/* Global Navbar */}
      <Navbar />

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HERO SECTION: THE SPORTSWEAR AUTOMATION ENGINE
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Technical Grid Pattern & Glows */}
        <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#E4572E]/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          
          {/* Top Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span className="badge-pill px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm border border-[#E4572E]/25 bg-white/90">
              <Sparkles size={14} className="text-[#E4572E] animate-pulse" />
              <span>World's #1 Sublimation & Sportswear OS</span>
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#171717] tracking-tight leading-[1.08] mb-6"
          >
            Automate Your Jersey & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E4572E] via-[#F07A54] to-[#C2410C]">
              Sublimation Production
            </span> <br />
            In 3 Simple Steps.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-[#52525B] max-w-3xl mx-auto leading-relaxed mb-10 font-normal"
          >
            Eliminate endless hours in Photoshop, manual squad grading mistakes, and disorganised WhatsApp orders. 
            From <strong className="text-[#171717] font-semibold">vector multi-size grading</strong> to <strong className="text-[#171717] font-semibold">high-yield roll nesting</strong> and <strong className="text-[#171717] font-semibold">automated factory order ledgers</strong>.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Link
              to="/production"
              className="btn-primary w-full sm:w-auto px-8 py-4 text-base font-bold shadow-brand flex items-center justify-center gap-2 group"
            >
              <span>Launch Production Studio</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/order-management"
              className="btn-secondary w-full sm:w-auto px-8 py-4 text-base font-bold bg-white hover:bg-neutral-50 border border-[#E8E4DE] text-[#171717] flex items-center justify-center gap-2"
            >
              <Package size={18} className="text-[#E4572E]" />
              <span>Explore Order Portal</span>
            </Link>
            <a
              href="#pricing"
              className="text-sm font-semibold text-[#52525B] hover:text-[#E4572E] px-4 py-2 transition-colors flex items-center gap-1"
            >
              <span>View Pricing Matrix</span>
              <ChevronDown size={14} />
            </a>
          </motion.div>

          {/* Live Trust Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto pt-8 border-t border-[#E8E4DE]"
          >
            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#E8E4DE] text-left">
              <p className="text-3xl lg:text-4xl font-black text-[#E4572E] mb-1">
                <AnimatedCounter target={500000} suffix="+" />
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Jerseys Processed
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#E8E4DE] text-left">
              <p className="text-3xl lg:text-4xl font-black text-[#171717] mb-1">
                <AnimatedCounter target={94} suffix=".8%" />
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Fabric Roll Nesting Yield
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#E8E4DE] text-left">
              <p className="text-3xl lg:text-4xl font-black text-[#E4572E] mb-1">
                ₹3.50
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Starting Per-Piece Export
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#E8E4DE] text-left">
              <p className="text-3xl lg:text-4xl font-black text-[#171717] mb-1">
                4 Mins
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                Squad Batch vs 4 Hours
              </p>
            </div>
          </motion.div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          2. INTERACTIVE LIVE PLATFORM DEMO (REPLACING THE CLUNKY 450VH VIDEO)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pb-24 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Interactive Sandbox Header with Switcher Tabs */}
          <div className="bg-white rounded-3xl p-4 sm:p-8 border border-[#E8E4DE] shadow-soft-lg">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#E8E4DE]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#E4572E] bg-[#E4572E]/10 px-3 py-1 rounded-full border border-[#E4572E]/20">
                  Interactive Studio Sandbox
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#171717] mt-2">
                  Experience The Automation In Real Time
                </h3>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex p-1.5 rounded-2xl bg-[#F5F3EF] border border-[#E8E4DE]">
                <button
                  onClick={() => setActiveSandboxTab('production')}
                  className={cn(
                    'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2',
                    activeSandboxTab === 'production'
                      ? 'bg-[#E4572E] text-white shadow-sm'
                      : 'text-[#52525B] hover:text-[#171717]'
                  )}
                >
                  <Zap size={16} />
                  <span>3-Step Production Studio</span>
                </button>
                <button
                  onClick={() => setActiveSandboxTab('orders')}
                  className={cn(
                    'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2',
                    activeSandboxTab === 'orders'
                      ? 'bg-[#171717] text-white shadow-sm'
                      : 'text-[#52525B] hover:text-[#171717]'
                  )}
                >
                  <Package size={16} />
                  <span>Order Management Portal</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: 3-STEP PRODUCTION STUDIO SIMULATOR */}
            {activeSandboxTab === 'production' && (
              <div className="pt-6">
                
                {/* 3 Step Stepper Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  {[
                    { step: 1, title: 'Step 1: Master Artwork & Panels', desc: 'Vector multi-panel mapping & 3D preview' },
                    { step: 2, title: 'Step 2: Auto-Grading & Roster', desc: 'Instant XS to 5XL sizing & vector squad names' },
                    { step: 3, title: 'Step 3: Roll Nesting & 300 DPI Export', desc: 'Fabric width optimization & RIP-ready TIFF/PDF' },
                  ].map((s) => (
                    <button
                      key={s.step}
                      onClick={() => setProdStep(s.step as 1 | 2 | 3)}
                      className={cn(
                        'p-4 rounded-2xl text-left border transition-all relative overflow-hidden',
                        prodStep === s.step
                          ? 'bg-[#E4572E]/5 border-[#E4572E] ring-2 ring-[#E4572E]/20 shadow-sm'
                          : 'bg-[#F9F8F6] border-[#E8E4DE] hover:border-neutral-300'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          'text-xs font-black px-2 py-0.5 rounded-md uppercase',
                          prodStep === s.step ? 'bg-[#E4572E] text-white' : 'bg-neutral-200 text-neutral-700'
                        )}>
                          0{s.step}
                        </span>
                        {prodStep === s.step && (
                          <span className="w-2 h-2 rounded-full bg-[#E4572E] animate-ping" />
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#171717]">{s.title}</p>
                      <p className="text-xs text-[#71717A] mt-0.5">{s.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Simulated Step Canvas Preview */}
                <div className="bg-[#171717] text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-neutral-800">
                  <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />

                  {/* STEP 1: ARTWORK & MULTI-PANEL */}
                  {prodStep === 1 && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div>
                          <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                            PANEL CONFIGURATION
                          </span>
                          <h4 className="text-lg font-bold text-white mt-1">
                            Multi-Panel Sublimation Blueprint (Front, Back, Raglan Sleeves & Collar)
                          </h4>
                        </div>
                        {/* Sports selector */}
                        <div className="flex gap-2">
                          {(['cricket', 'football', 'kabaddi', 'esports'] as const).map((sport) => (
                            <button
                              key={sport}
                              onClick={() => setSelectedSport(sport)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors',
                                selectedSport === sport
                                  ? 'bg-[#E4572E] text-white'
                                  : 'bg-white/10 text-neutral-400 hover:text-white'
                              )}
                            >
                              {sport}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Panel visual cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { panel: 'Front Chest', dim: '58cm x 72cm', color: 'from-orange-600/40 to-neutral-900', label: 'Team Logo + Sponsor' },
                          { panel: 'Back Panel', dim: '60cm x 75cm', color: 'from-orange-700/40 to-neutral-900', label: 'Player Name & Number' },
                          { panel: 'Left Sleeve', dim: '24cm x 42cm', color: 'from-neutral-800 to-neutral-900', label: 'Tournament Patch' },
                          { panel: 'Right Sleeve', dim: '24cm x 42cm', color: 'from-neutral-800 to-neutral-900', label: 'Brand Tag + Ribbing' },
                        ].map((p, idx) => (
                          <div key={idx} className="rounded-xl border border-white/10 bg-gradient-to-b p-4 relative flex flex-col justify-between h-48">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-mono text-neutral-400">{p.panel}</span>
                              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-neutral-300">{p.dim}</span>
                            </div>
                            <div className="my-auto text-center">
                              <div className="w-10 h-10 mx-auto rounded-lg bg-white/10 flex items-center justify-center text-orange-400 font-bold text-sm mb-2">
                                {idx === 1 ? sportsConfigs[selectedSport].number : 'AI'}
                              </div>
                              <p className="text-xs font-medium text-neutral-200">{p.label}</p>
                            </div>
                            <div className="text-[10px] text-emerald-400 font-mono text-center bg-emerald-500/10 rounded py-0.5 border border-emerald-500/20">
                              ✓ Bleed & Seam Verified
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between text-xs text-neutral-400 pt-4 border-t border-neutral-800">
                        <span>Format: Vector SVG / High-Res PNG (300 DPI CMYK)</span>
                        <button
                          onClick={() => setProdStep(2)}
                          className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          Next: Auto-Grading & Squad Roster <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: AUTO-GRADING & ROSTER */}
                  {prodStep === 2 && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div>
                          <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                            STEP 02: DYNAMIC SQUAD ROSTER
                          </span>
                          <h4 className="text-lg font-bold text-white mt-1">
                            Instant Vector Size-Grading with Zero Alignment Errors
                          </h4>
                        </div>
                        {/* Size selector buttons */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 font-medium mr-1">Preview Size:</span>
                          {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => (
                            <button
                              key={sz}
                              onClick={() => setSelectedSize(sz)}
                              className={cn(
                                'w-8 h-8 rounded-lg text-xs font-black transition-all',
                                selectedSize === sz
                                  ? 'bg-[#E4572E] text-white ring-2 ring-orange-400/50 scale-105'
                                  : 'bg-white/10 text-neutral-400 hover:bg-white/20 hover:text-white'
                              )}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interactive jersey back simulator */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center relative flex flex-col items-center justify-center min-h-[220px]">
                          <div className="absolute top-3 left-4 text-xs font-mono text-neutral-400">
                            SIZE: <span className="text-orange-400 font-bold">{selectedSize}</span> | FONT: OLD SPORT ATHLETIC
                          </div>
                          
                          {/* Player Name and Number that change with preview */}
                          <div className="mt-4">
                            <p 
                              className="font-black tracking-widest text-white uppercase transition-all duration-300"
                              style={{ 
                                fontSize: selectedSize === 'S' ? '20px' : selectedSize === 'M' ? '24px' : selectedSize === 'L' ? '28px' : selectedSize === 'XL' ? '32px' : '36px',
                                textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                              }}
                            >
                              {sportsConfigs[selectedSport].player}
                            </p>
                            <p 
                              className="font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 leading-none transition-all duration-300 my-2"
                              style={{ 
                                fontSize: selectedSize === 'S' ? '80px' : selectedSize === 'M' ? '96px' : selectedSize === 'L' ? '110px' : selectedSize === 'XL' ? '124px' : '136px',
                                fontFamily: "'OldSport02AthleticNcv-E0gj', 'Jersey M54', sans-serif"
                              }}
                            >
                              {sportsConfigs[selectedSport].number}
                            </p>
                            <div className="inline-block px-3 py-1 rounded bg-black/60 border border-white/10 text-[10px] text-neutral-300 font-mono">
                              FiveNest Brand Tag Attached (₹3.50/pc rate)
                            </div>
                          </div>
                        </div>

                        {/* Roster Batch Specs */}
                        <div className="space-y-3">
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center text-xs">
                            <span className="text-neutral-400">Squad Batch Count:</span>
                            <span className="font-bold text-white">45 Players (CSV Upload)</span>
                          </div>
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center text-xs">
                            <span className="text-neutral-400">Size Curve Grading:</span>
                            <span className="font-bold text-emerald-400">Automatic XS to 5XL</span>
                          </div>
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center text-xs">
                            <span className="text-neutral-400">Font Rendering Engine:</span>
                            <span className="font-bold text-white">Vector Curves (No Blurriness)</span>
                          </div>
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center text-xs">
                            <span className="text-neutral-400">Total Generation Time:</span>
                            <span className="font-bold text-orange-400">12 Seconds for 45 Jerseys</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between text-xs text-neutral-400 pt-4 border-t border-neutral-800">
                        <button
                          onClick={() => setProdStep(1)}
                          className="hover:text-white cursor-pointer"
                        >
                          ← Back to Step 1
                        </button>
                        <button
                          onClick={() => setProdStep(3)}
                          className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          Next: High-Yield Roll Nesting <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: ROLL NESTING & EXPORT */}
                  {prodStep === 3 && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div>
                          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            STEP 03: HIGH-YIELD ROLL NESTING
                          </span>
                          <h4 className="text-lg font-bold text-white mt-1">
                            Save Up to 15% Fabric with Intelligent Roll Nesting & 300 DPI RIP Output
                          </h4>
                        </div>
                        {/* Roll width toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 font-medium mr-1">Roll Width:</span>
                          {(['44"', '60"', '72"'] as const).map((w) => (
                            <button
                              key={w}
                              onClick={() => setRollWidth(w)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                rollWidth === w
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-white/10 text-neutral-400 hover:bg-white/20 hover:text-white'
                              )}
                            >
                              {w} Paper Roll
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Visual Roll Layout Representation */}
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-6">
                        <div className="flex justify-between items-center text-xs font-mono text-neutral-400 mb-2">
                          <span>DYE-SUBLIMATION PAPER ROLL ({rollWidth} WIDE)</span>
                          <span className="text-emerald-400 font-bold">FABRIC UTILIZATION: 94.8%</span>
                        </div>

                        {/* Simulated Nesting Grid */}
                        <div className="h-28 rounded-xl bg-neutral-950 border border-dashed border-neutral-700 p-2 flex gap-2 overflow-x-auto items-center">
                          {[
                            { name: 'Back L', w: 'w-20', h: 'h-24', color: 'bg-orange-500/20 border-orange-500/40 text-orange-300' },
                            { name: 'Front L', w: 'w-20', h: 'h-24', color: 'bg-orange-600/20 border-orange-600/40 text-orange-300' },
                            { name: 'Sleeve 1', w: 'w-14', h: 'h-20', color: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
                            { name: 'Sleeve 2', w: 'w-14', h: 'h-20', color: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
                            { name: 'Collar', w: 'w-10', h: 'h-16', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
                            { name: 'Back XL', w: 'w-24', h: 'h-24', color: 'bg-orange-500/20 border-orange-500/40 text-orange-300' },
                            { name: 'Front XL', w: 'w-24', h: 'h-24', color: 'bg-orange-600/20 border-orange-600/40 text-orange-300' },
                            { name: 'Sleeves', w: 'w-16', h: 'h-22', color: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
                          ].map((block, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex-shrink-0 rounded-lg border flex flex-col items-center justify-center text-[10px] font-mono p-1',
                                block.w, block.h, block.color
                              )}
                            >
                              <span className="font-bold">{block.name}</span>
                              <span className="text-[9px] opacity-70">300 DPI</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Export Compatibility Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-2 text-neutral-300">
                          <CheckCircle size={16} className="text-emerald-400" />
                          <span>Directly Compatible With: Wasatch, NeoStampa, PhotoPrint, Mimaki RasterLink, Epson Edge</span>
                        </div>
                        <Link
                          to="/production"
                          className="px-4 py-2 rounded-xl bg-[#E4572E] text-white font-bold hover:bg-[#D4431B] transition-colors flex items-center gap-1.5"
                        >
                          <Download size={14} />
                          <span>Test Live Nesting in Studio</span>
                        </Link>
                      </div>
                    </div>
                  )}

                </div>

                <div className="mt-4 text-center">
                  <Link
                    to="/production"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#E4572E] hover:underline"
                  >
                    Open Full Production Studio Interface <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ORDER MANAGEMENT PORTAL DEMO */}
            {activeSandboxTab === 'orders' && (
              <div className="pt-6">
                
                {/* Simulated Order Dashboard */}
                <div className="bg-[#FAF9F6] rounded-2xl p-6 border border-[#E8E4DE]">
                  
                  {/* Dashboard header stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-white border border-[#E8E4DE]">
                      <p className="text-xs font-semibold text-[#71717A]">Active Orders</p>
                      <p className="text-2xl font-black text-[#171717] mt-1">18 Jobs</p>
                      <span className="text-[11px] text-emerald-600 font-bold">● 4 In Production</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E8E4DE]">
                      <p className="text-xs font-semibold text-[#71717A]">Jerseys In Queue</p>
                      <p className="text-2xl font-black text-[#E4572E] mt-1">1,480 Pcs</p>
                      <span className="text-[11px] text-[#71717A]">Across 6 Tournaments</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E8E4DE]">
                      <p className="text-xs font-semibold text-[#71717A]">Weekly Revenue</p>
                      <p className="text-2xl font-black text-[#171717] mt-1">₹4.2 Lakh</p>
                      <span className="text-[11px] text-emerald-600 font-bold">↑ 28% this week</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-[#E8E4DE]">
                      <p className="text-xs font-semibold text-[#71717A]">Factory Wallet Balance</p>
                      <p className="text-2xl font-black text-[#171717] mt-1">₹6,850</p>
                      <span className="text-[11px] text-blue-600 font-bold">~2,490 Exports Remaining</span>
                    </div>
                  </div>

                  {/* Simulated Live Orders Table */}
                  <div className="bg-white rounded-xl border border-[#E8E4DE] overflow-hidden mb-4">
                    <div className="px-4 py-3 bg-[#F5F3EF] border-b border-[#E8E4DE] flex justify-between items-center text-xs font-bold text-[#52525B]">
                      <span>ORDER ID / CLIENT</span>
                      <span>QTY & SPECS</span>
                      <span>STATUS</span>
                      <span>ACTION</span>
                    </div>
                    
                    {[
                      { id: '#FN-9401', client: 'Mumbai Strikers Club', sport: 'Football Sublimation', count: '45 jerseys', status: 'In Production', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
                      { id: '#FN-9402', client: 'Tirupur Apparel Corp', sport: 'Cricket Poly Spandex', count: '120 jerseys', status: 'Files Dispatched', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                      { id: '#FN-9403', client: 'Delhi Hawks Esports', sport: 'DTF + Sublimation Hoodies', count: '30 pieces', status: 'Billing Pending', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
                      { id: '#FN-9404', client: 'Bangalore Bulls Sports', sport: 'Kabaddi Combat Wear', count: '65 jerseys', status: 'Ready for Cut', badge: 'bg-orange-100 text-[#E4572E] border-orange-200' },
                    ].map((order, i) => (
                      <div key={i} className="px-4 py-3.5 border-b border-[#E8E4DE] last:border-0 flex items-center justify-between text-xs hover:bg-[#FDFBF7] transition-colors">
                        <div>
                          <p className="font-bold text-[#171717] text-sm">{order.client}</p>
                          <p className="text-[#71717A] text-[11px] font-mono">{order.id} • {order.sport}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#171717]">{order.count}</p>
                          <p className="text-[11px] text-[#71717A]">Auto Sized</p>
                        </div>
                        <div>
                          <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold border', order.badge)}>
                            {order.status}
                          </span>
                        </div>
                        <div>
                          <button className="px-3 py-1.5 rounded-lg bg-[#F5F3EF] hover:bg-[#EAE6DE] text-[#171717] font-semibold text-xs border border-[#E8E4DE]">
                            View Job Sheet
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Highlights Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#52525B] pt-2">
                    <span className="flex items-center gap-1.5">
                      <Shield size={14} className="text-[#E4572E]" />
                      Included automatically for all Monthly/Quarterly Plans of ₹2,500 and above
                    </span>
                    <Link
                      to="/order-management"
                      className="font-bold text-[#E4572E] hover:underline flex items-center gap-1"
                    >
                      Open Live Order Management Portal <ArrowRight size={14} />
                    </Link>
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          3. DEEP DIVE: THE 3-STEP PRODUCTION REVOLUTION
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#EFECE6]/50 border-t border-[#E8E4DE]">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="badge-pill mb-4 inline-block font-bold">
              Engineering Workflow
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
              The 3-Step Production Studio
            </h2>
            <p className="text-base sm:text-lg text-[#52525B] leading-relaxed">
              How FiveNest replaces an entire team of graphic designers nudging Photoshop layers with a 100% automated vector workflow.
            </p>
          </div>

          <div className="space-y-12">
            
            {/* STEP 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white p-8 sm:p-10 rounded-3xl border border-[#E8E4DE] shadow-soft">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#E4572E]/10 text-[#E4572E] text-xs font-black uppercase mb-4">
                  <span>Step 01</span> • <span>Master Artwork Setup</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#171717] mb-4">
                  Multi-Panel Garment Assembly & 3D Vector Projection
                </h3>
                <p className="text-[#52525B] text-sm leading-relaxed mb-6">
                  Upload your master vector design once. FiveNest maps individual garment pattern cuts with millimetre precision — front chest, full back, raglan or set-in sleeves, round or V-neck collars, and side mesh inserts.
                </p>
                <ul className="space-y-3 mb-6 text-sm text-[#52525B]">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0" />
                    <span>Real-time 3D jersey rotation and digital proof preview</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0" />
                    <span>Automatic sewing seam allowances & heat-press bleed lines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0" />
                    <span>Support for AI, EPS, SVG vector graphics and 300 DPI PNG files</span>
                  </li>
                </ul>
                <div className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E8E4DE] text-xs text-[#52525B]">
                  <strong className="text-[#171717]">No graphic degradation:</strong> Vector assets retain crisp, razor-sharp edges even when expanded to 5XL sizes.
                </div>
              </div>

              <div className="bg-[#171717] text-white p-6 rounded-2xl border border-neutral-800">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-neutral-800 text-xs font-mono text-neutral-400">
                  <span>PANEL GEOMETRY ENGINE</span>
                  <span className="text-orange-400">300 DPI CMYK</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <p className="text-xs font-mono text-neutral-400 mb-1">FRONT PANEL</p>
                    <p className="text-sm font-bold text-white">Chest Logo & Sublimation Blend</p>
                    <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Free Panel (₹0.00)</span>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <p className="text-xs font-mono text-neutral-400 mb-1">SLEEVE CUTS</p>
                    <p className="text-sm font-bold text-white">Left & Right Raglan Cuts</p>
                    <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Free Panel (₹0.00)</span>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-900 border border-orange-500/30 col-span-2">
                    <p className="text-xs font-mono text-orange-400 mb-1">BACK PANEL (VARIABLE ROSTER)</p>
                    <p className="text-sm font-bold text-white">Automatic Player Name + Squad Number Placement</p>
                    <span className="text-[10px] text-orange-400 font-mono mt-1 block">Billed only on final export (₹3.50/pc)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white p-8 sm:p-10 rounded-3xl border border-[#E8E4DE] shadow-soft">
              <div className="order-2 lg:order-1 bg-[#171717] text-white p-6 rounded-2xl border border-neutral-800">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-neutral-800 text-xs font-mono text-neutral-400">
                  <span>VECTOR ROSTER ENGINE</span>
                  <span className="text-emerald-400">100% TYPO-PROOF</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { player: 'ROHIT SHARMA', no: '45', size: 'XL', chest: '44"', status: 'Graded' },
                    { player: 'VIRAT KOHLI', no: '18', size: 'L', chest: '42"', status: 'Graded' },
                    { player: 'HARDIK PANDYA', no: '33', size: 'M', chest: '40"', status: 'Graded' },
                    { player: 'JASPRIT BUMRAH', no: '93', size: 'XXL', chest: '46"', status: 'Graded' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center">
                          {row.no}
                        </span>
                        <div>
                          <p className="text-white font-bold">{row.player}</p>
                          <p className="text-[10px] text-neutral-400">Chest: {row.chest}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[11px] mr-2">
                          {row.size}
                        </span>
                        <span className="text-emerald-400 text-[10px]">● {row.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#E4572E]/10 text-[#E4572E] text-xs font-black uppercase mb-4">
                  <span>Step 02</span> • <span>Grading & Roster</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#171717] mb-4">
                  Smart Size Grading (XS to 5XL) & Dynamic Squad Names
                </h3>
                <p className="text-[#52525B] text-sm leading-relaxed mb-6">
                  Paste your tournament squad list or upload an Excel sheet. The engine automatically adapts artwork proportions across every jersey size so logos and graphics stay in perfect visual proportion from junior sizes to 5XL.
                </p>
                <ul className="space-y-3 mb-6 text-sm text-[#52525B]">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0" />
                    <span>Dynamic text arching, stroke outlines, drop shadows & vector fills</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0" />
                    <span>Built-in authentic jersey fonts (OldSport, College, Jersey M54, Khand)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0" />
                    <span>Zero duplicate numbers or misspelled names with automated validation</span>
                  </li>
                </ul>
                <div className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E8E4DE] text-xs text-[#52525B]">
                  <strong className="text-[#171717]">Batch Processing Speed:</strong> A complete 100-player roster completes in under 20 seconds.
                </div>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white p-8 sm:p-10 rounded-3xl border border-[#E8E4DE] shadow-soft">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#E4572E]/10 text-[#E4572E] text-xs font-black uppercase mb-4">
                  <span>Step 03</span> • <span>Nesting & RIP Export</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#171717] mb-4">
                  High-Yield Roll Nesting & 300 DPI CMYK Print Exports
                </h3>
                <p className="text-[#52525B] text-sm leading-relaxed mb-6">
                  Fabric and sublimation transfer paper are major factory expenses. Our high-density polygon nesting algorithms pack your graded panels with optimal rotation, reducing roll paper consumption by up to 15%.
                </p>
                <ul className="space-y-3 mb-6 text-sm text-[#52525B]">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0" />
                    <span>Configurable roll widths (44", 60", 64", 72" dye-sub paper rolls)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0" />
                    <span>Automatic rotary cutter marks, roll meters counter & size labels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0" />
                    <span>Direct RIP software import into Wasatch, Ergosoft, PhotoPrint & Mimaki</span>
                  </li>
                </ul>
                <div className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E8E4DE] text-xs text-[#52525B]">
                  <strong className="text-[#171717]">Instant Download:</strong> Graded ZIP archives with organised TIFF/PDF files ready for printing immediately.
                </div>
              </div>

              <div className="bg-[#171717] text-white p-6 rounded-2xl border border-neutral-800">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-neutral-800 text-xs font-mono text-neutral-400">
                  <span>ROLL METRICS & EFFICIENCY</span>
                  <span className="text-emerald-400">94.8% UTILIZATION</span>
                </div>
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between">
                    <span className="text-neutral-400">Sublimation Paper Saved:</span>
                    <span className="text-emerald-400 font-bold">~14.2 Meters / 100 Jerseys</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between">
                    <span className="text-neutral-400">Output Resolution:</span>
                    <span className="text-white font-bold">300 DPI CMYK (Lossless TIFF)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between">
                    <span className="text-neutral-400">Cut Lines & Bleed:</span>
                    <span className="text-white font-bold">Auto 10mm Seam Bleed</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between">
                    <span className="text-neutral-400">Export Packaging:</span>
                    <span className="text-orange-400 font-bold">Direct Folder ZIP by Size</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          4. ORDER MANAGEMENT PORTAL & FACTORY LEDGERS
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-white border-t border-[#E8E4DE]" id="orders">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="badge-pill mb-4 inline-block font-bold">
              Factory Operations Hub
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
              Complete Order & Production Management
            </h2>
            <p className="text-base sm:text-lg text-[#52525B] leading-relaxed">
              Designed specifically for sportswear printers, uniform makers, and textile manufacturers to track jobs, invoices, and factory ledgers in one unified hub.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: <Users className="text-[#E4572E]" size={24} />,
                title: 'Client Self-Service Portal',
                desc: 'Give your wholesale clients a branded portal link. They input squad names, sizes, upload vector logos, and approve digital proofs directly.',
              },
              {
                icon: <FileText className="text-[#E4572E]" size={24} />,
                title: 'Factory Cutting Job Sheets',
                desc: 'Generate printable job sheets with fabric yardage, panel counts, size distributions, and heat-press temperature instructions for floor staff.',
              },
              {
                icon: <BarChart3 className="text-[#E4572E]" size={24} />,
                title: 'Real-Time P&L & Ledgers',
                desc: 'Track exact production cost per jersey, ink consumption, paper usage, and customer receivables with automated ledger updates.',
              },
              {
                icon: <Shield className="text-[#E4572E]" size={24} />,
                title: 'Instant GST Tax Invoices',
                desc: 'Issue GST-compliant invoices with HSN codes, integrate Razorpay payment links, and collect advance payments with zero friction.',
              },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#F5F3EF] border border-[#E8E4DE] hover:border-neutral-300 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm border border-[#E8E4DE]">
                  {f.icon}
                </div>
                <h4 className="text-lg font-bold text-[#171717] mb-2">{f.title}</h4>
                <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Access Callout Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-neutral-900 via-[#171717] to-neutral-900 text-white border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30 mb-2">
                <Flame size={14} /> Full Access Included
              </div>
              <h3 className="text-2xl font-black text-white">
                Unlocked for all Growth, Pro & Factory Plans (≥ ₹2,500)
              </h3>
              <p className="text-neutral-400 text-sm max-w-xl mt-1">
                Say goodbye to WhatsApp chaos and lost orders. Subscribe to any plan above ₹2,500 to run your entire factory pipeline on autopilot.
              </p>
            </div>
            <Link
              to="/order-management"
              className="px-6 py-3.5 rounded-xl bg-[#E4572E] text-white font-bold hover:bg-[#D4431B] transition-colors whitespace-nowrap flex items-center gap-2 shadow-brand"
            >
              <span>Explore Order Portal</span>
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          5. INTERACTIVE SAVINGS & ROI CALCULATOR
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#F5F3EF] border-t border-[#E8E4DE]">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="badge-pill mb-4 inline-block font-bold">
              Factory Profitability Calculator
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight mb-4">
              How Much Will FiveNest Save Your Factory?
            </h2>
            <p className="text-sm sm:text-base text-[#52525B]">
              Slide to your monthly jersey production volume to see your exact time and cost savings.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E4DE] shadow-soft-lg">
            
            {/* Interactive Slider */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-[#171717]">Monthly Jersey Output:</span>
                <span className="text-2xl font-black text-[#E4572E] font-mono">
                  {monthlyJerseys.toLocaleString()} Jerseys / month
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={monthlyJerseys}
                onChange={(e) => setMonthlyJerseys(Number(e.target.value))}
                className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#E4572E]"
              />
              <div className="flex justify-between text-[11px] text-[#71717A] mt-2 font-mono">
                <span>50 Jerseys (Small Shop)</span>
                <span>1,000 Jerseys (Medium Studio)</span>
                <span>5,000+ Jerseys (Large Factory)</span>
              </div>
            </div>

            {/* Live Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#E8E4DE]">
              
              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DE]">
                <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-1">
                  Design Hours Saved
                </p>
                <p className="text-3xl sm:text-4xl font-black text-[#171717] mb-1">
                  {hoursSaved} hrs
                </p>
                <p className="text-xs text-[#52525B]">
                  From {manualHours} manual Photoshop hours down to {fivenestHours} hrs in FiveNest.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#E4572E]/10 border border-[#E4572E]/20">
                <p className="text-xs font-bold text-[#E4572E] uppercase tracking-wider mb-1">
                  Monthly Cost Saved
                </p>
                <p className="text-3xl sm:text-4xl font-black text-[#E4572E] mb-1">
                  ₹{moneySaved.toLocaleString()}
                </p>
                <p className="text-xs text-[#52525B]">
                  Replaces manual graphic design labor and eliminates expensive misprint reworks.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DE]">
                <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-1">
                  Fabric & Paper Saved
                </p>
                <p className="text-3xl sm:text-4xl font-black text-emerald-600 mb-1">
                  ~{fabricSavedMeters} Meters
                </p>
                <p className="text-xs text-[#52525B]">
                  Via automated polygon nesting with 94.8% roll width yield efficiency.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          6. OFFICIAL SUBSCRIPTION & RECHARGE PRICING MATRIX
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-white border-t border-[#E8E4DE]" id="pricing">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="badge-pill mb-4 inline-block font-bold">
              Transparent Factory Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
              Subscription & On-The-Spot Plans
            </h2>
            <p className="text-base sm:text-lg text-[#52525B] leading-relaxed">
              Every single rupee of subscription is 100% credited into your export wallet. Use tokens to generate print-ready files at industrial wholesale rates.
            </p>

            {/* Matrix Tabs: Monthly | Quarterly | On-The-Spot */}
            <div className="inline-flex p-1.5 rounded-2xl bg-[#F5F3EF] border border-[#E8E4DE] mt-8">
              <button
                onClick={() => setPricingTab('monthly')}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all',
                  pricingTab === 'monthly'
                    ? 'bg-[#E4572E] text-white shadow-sm'
                    : 'text-[#52525B] hover:text-[#171717]'
                )}
              >
                Monthly Plans (30 Days)
              </button>
              <button
                onClick={() => setPricingTab('quarterly')}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all',
                  pricingTab === 'quarterly'
                    ? 'bg-[#E4572E] text-white shadow-sm'
                    : 'text-[#52525B] hover:text-[#171717]'
                )}
              >
                Quarterly Plans (90 Days)
              </button>
              <button
                onClick={() => setPricingTab('spot')}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all',
                  pricingTab === 'spot'
                    ? 'bg-[#E4572E] text-white shadow-sm'
                    : 'text-[#52525B] hover:text-[#171717]'
                )}
              >
                On-The-Spot (Per Job QR)
              </button>
            </div>
          </div>

          {/* ON-THE-SPOT TAB */}
          {pricingTab === 'spot' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#FAF9F6] rounded-3xl p-8 border-2 border-[#E4572E] shadow-soft-lg text-center relative overflow-hidden">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E4572E] text-white text-xs font-bold uppercase tracking-wider mb-4">
                  <Zap size={14} /> Pay Only When You Export
                </div>
                <h3 className="text-3xl font-black text-[#171717] mb-2">On-The-Spot Instant QR</h3>
                <p className="text-sm text-[#52525B] max-w-md mx-auto mb-6">
                  Zero monthly commitment. Process and grade your jerseys, preview in 3D, and scan an instant Razorpay UPI QR code only when downloading print files.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6 text-left">
                  <div className="p-4 rounded-2xl bg-white border border-[#E8E4DE]">
                    <p className="text-xs text-[#71717A] font-semibold">With FiveNest Tag</p>
                    <p className="text-3xl font-black text-[#E4572E] my-1">₹3.50<span className="text-xs text-[#71717A] font-normal"> /pc</span></p>
                    <p className="text-xs text-[#52525B]">Includes small FiveNest hem tag</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#E8E4DE]">
                    <p className="text-xs text-[#71717A] font-semibold">Standard (No Tag)</p>
                    <p className="text-3xl font-black text-[#171717] my-1">₹5.50<span className="text-xs text-[#71717A] font-normal"> /pc</span></p>
                    <p className="text-xs text-[#52525B]">100% white-label exports</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-[#52525B] text-left max-w-md mx-auto mb-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Front & sleeve panels are ALWAYS FREE (only back roster is charged)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>A4 DTF print panels at just ₹0.50/pc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Instant UPI payment via GPay, PhonePe, Paytm, BHIM</span>
                  </div>
                </div>

                <Link
                  to="/production"
                  className="btn-primary w-full py-4 text-center block font-bold text-base shadow-brand"
                >
                  Start Exporting Now (Instant QR)
                </Link>
              </div>
            </div>
          )}

          {/* MONTHLY & QUARTERLY SUBSCRIPTION CARDS */}
          {pricingTab !== 'spot' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {SUBSCRIPTION_PLANS.filter((p) => p.type === pricingTab).map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300',
                    plan.isPopular
                      ? 'bg-white border-2 border-[#E4572E] shadow-soft-lg ring-4 ring-[#E4572E]/10'
                      : 'bg-[#FAF9F6] border border-[#E8E4DE] hover:border-neutral-300'
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#E4572E] rounded-full text-white text-[11px] font-black tracking-wider uppercase shadow-sm">
                      MOST POPULAR
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">
                        {plan.name}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-[#171717]">
                          ₹{plan.upfront.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-[#71717A]">
                          / {plan.validityLabel}
                        </span>
                      </div>
                      <p className="text-xs text-[#52525B] mt-2 line-clamp-2">
                        {plan.tagline}
                      </p>
                    </div>

                    {/* Per Jersey Cost Matrix */}
                    <div className="p-3.5 rounded-2xl bg-white border border-[#E8E4DE] mb-5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#52525B]">With Tag Rate:</span>
                        <span className="font-bold text-[#E4572E]">
                          ₹{plan.rateWithTag.toFixed(2)}/pc (~{plan.jerseysWithTag} jerseys)
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#52525B]">Without Tag:</span>
                        <span className="font-bold text-[#171717]">
                          ₹{plan.rateWithoutTag.toFixed(2)}/pc (~{plan.jerseysWithoutTag} jerseys)
                        </span>
                      </div>
                    </div>

                    {/* Order Portal Badge */}
                    <div className="mb-5">
                      {plan.hasOrderPortalAccess ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                          <span>Includes Order Management Portal</span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-600 text-[11px] font-medium flex items-center gap-1.5">
                          <span>Studio Only (Order Portal not included)</span>
                        </div>
                      )}
                    </div>

                    {/* Feature bullet list */}
                    <ul className="space-y-2.5 mb-6 text-xs text-[#52525B]">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check size={14} className="text-[#E4572E] mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to="/contact"
                    className={cn(
                      'w-full py-3 rounded-xl font-bold text-center text-xs sm:text-sm transition-all block',
                      plan.isPopular
                        ? 'bg-[#E4572E] hover:bg-[#D4431B] text-white shadow-brand'
                        : 'bg-white hover:bg-neutral-100 text-[#171717] border border-[#E8E4DE]'
                    )}
                  >
                    Select {plan.name}
                  </Link>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          7. TRADITIONAL VS FIVENEST COMPARISON TABLE
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#F5F3EF] border-t border-[#E8E4DE]">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="text-center mb-14">
            <span className="badge-pill mb-4 inline-block font-bold">
              Side-by-Side Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight mb-3">
              Photoshop vs FiveNest Production OS
            </h2>
            <p className="text-sm text-[#52525B]">
              Why over 200+ Indian sportswear manufacturers switched away from legacy graphic software.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8E4DE] shadow-soft overflow-hidden">
            <div className="grid grid-cols-3 p-4 sm:p-5 bg-[#FAF9F6] border-b border-[#E8E4DE] text-xs font-bold text-[#52525B]">
              <span>CAPABILITY</span>
              <span className="text-neutral-500">MANUAL PHOTOSHOP</span>
              <span className="text-[#E4572E]">FIVENEST AUTOMATION</span>
            </div>

            {[
              { cap: 'Squad Grading Speed', old: '3 to 5 hours / 50 jerseys', fn: '15 seconds automatic' },
              { cap: 'Name & Number Placement', old: 'Manual typing & aligning each', fn: 'Auto-mapped vector fonts' },
              { cap: 'Typo & Misprint Risk', old: 'High (human fatigue mistakes)', fn: '0% (Excel/CSV exact match)' },
              { cap: 'Fabric Roll Nesting', old: 'Manual dragging in Corel/RIP', fn: '94.8% automated packing' },
              { cap: 'Order & Invoice Tracking', old: 'Scattered WhatsApp & Paper', fn: 'Integrated Factory Portal' },
              { cap: 'Cost Per Jersey', old: '₹25 - ₹40 designer salary', fn: '₹2.00 - ₹3.50 export fee' },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 p-4 sm:p-5 border-b border-[#E8E4DE] last:border-0 text-xs sm:text-sm items-center">
                <span className="font-bold text-[#171717]">{row.cap}</span>
                <span className="text-neutral-500">{row.old}</span>
                <span className="font-bold text-[#E4572E] flex items-center gap-1.5">
                  <CheckCircle size={15} className="text-emerald-600 flex-shrink-0" />
                  {row.fn}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          8. TESTIMONIALS & TRUST PROOF
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-white border-t border-[#E8E4DE]">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="badge-pill mb-4 inline-block font-bold">
              Factory Endorsements
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight mb-3">
              Powering India's Top Sublimation Hubs
            </h2>
            <p className="text-sm text-[#52525B]">
              Trusted by sportswear printing facilities across Tirupur, Surat, Ludhiana, Mumbai, Delhi, and Bangalore.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: 'During cricket tournament seasons, we used to have 3 designers working overtime until 2 AM. With FiveNest, 1 operator handles 600 jerseys before 6 PM.',
                author: 'Rajesh Sharma',
                factory: 'Apex Sports Uniforms, Delhi NCR',
                volume: '15,000+ Jerseys / Month',
              },
              {
                quote: 'The high-yield roll nesting alone pays for the entire software. We saved 180 meters of sublimation transfer paper in our first month alone.',
                author: 'Pravin Patel',
                factory: 'Surat Sublimation Mills, Gujarat',
                volume: '30,000+ Meters / Month',
              },
              {
                quote: 'Our clients love the Order Portal. They submit their squad lists directly, and no one argues about misspelled names because it is all verified digitally.',
                author: 'Senthil Murugan',
                factory: 'Tirupur Knitwear Export House, Tamil Nadu',
                volume: '22,000+ Pieces / Month',
              },
            ].map((t, i) => (
              <div key={i} className="p-8 rounded-3xl bg-[#FAF9F6] border border-[#E8E4DE] flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 text-amber-500 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={15} className="fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-[#171717] text-sm leading-relaxed mb-6 font-medium italic">
                    "{t.quote}"
                  </p>
                </div>
                <div className="pt-4 border-t border-[#E8E4DE]">
                  <p className="text-sm font-bold text-[#171717]">{t.author}</p>
                  <p className="text-xs text-[#71717A]">{t.factory}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-[#E4572E]/10 text-[#E4572E] text-[10px] font-bold">
                    {t.volume}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          9. FREQUENTLY ASKED QUESTIONS (FAQ)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#F5F3EF] border-t border-[#E8E4DE]">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="text-center mb-14">
            <span className="badge-pill mb-4 inline-block font-bold">
              Factory Questions Answered
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#52525B]">
              Everything you need to know about formats, subscriptions, nesting, and RIP software compatibility.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'What file formats can I upload and export?',
                a: 'You can upload master jersey artwork in AI, EPS, SVG vector formats, or 300 DPI transparent PNG. Exports are generated as lossless 300 DPI CMYK TIFF or high-resolution PDF organized in folders by size and player name, ready for immediate printing.',
              },
              {
                q: 'Which RIP software is supported?',
                a: 'FiveNest print files are compatible with every major industrial RIP engine, including Wasatch SoftRIP, Ergosoft, Onyx, PhotoPrint / Flexi, Mimaki RasterLink, Epson Edge Print, and Caldera.',
              },
              {
                q: 'How does the FiveNest tag discount work?',
                a: 'When you keep the discreet FiveNest branding tag on the jersey hem or neck label, you unlock our lowest rate of ₹3.50/pc (on-the-spot) or down to ₹2.00/pc on the Factory subscription plan. If you prefer completely white-label jerseys with zero branding, the standard rate is ₹5.50/pc.',
              },
              {
                q: 'Who gets access to the Order Management Portal?',
                a: 'The full Order Management Portal (client accounts, job sheets, factory ledgers, GST invoicing, payment links) is included at no extra charge for any monthly or quarterly subscription of ₹2,500 and above.',
              },
              {
                q: 'How do subscription wallet credits work?',
                a: 'When you purchase a subscription (e.g. ₹2,500 or ₹5,000), 100% of that upfront amount is added to your FiveNest export wallet. Each time you generate and download a print-ready jersey file, tokens are deducted at your discounted plan rate.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#E8E4DE] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-[#171717] flex justify-between items-center gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      'text-[#71717A] transition-transform duration-200 flex-shrink-0',
                      openFaq === i && 'rotate-180 text-[#E4572E]'
                    )}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#52525B] leading-relaxed border-t border-[#F5F3EF]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          10. FINAL CALL TO ACTION
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#171717] text-white overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-[#E4572E]/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-orange-400 border border-white/15 mb-6">
            <Sparkles size={14} /> Start Automating In Minutes
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6 leading-tight">
            Ready to Run Your Jersey Factory <br />
            <span className="text-[#E4572E]">Without Graphic Bottlenecks?</span>
          </h2>
          <p className="text-neutral-400 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of sportswear printers saving thousands of hours and lakhs of rupees with FiveNest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/production"
              className="btn-primary py-4 px-8 text-base shadow-brand flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>Launch Production Studio</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/order-management"
              className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/15 py-4 px-8 text-base w-full sm:w-auto"
            >
              <span>Open Order Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />

    </div>
  );
}
