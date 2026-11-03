import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Zap, Package, Settings, Users, Clock, CheckCircle, 
  ChevronDown, ChevronRight, Play, BarChart3, FileText, Wallet, 
  Shield, ShieldCheck, Sparkles, Layers, Sliders, Scissors, Printer, Download,
  TrendingUp, Award, HelpCircle, Check, ArrowUpRight, Flame, Laptop, Folder,
  Calendar, Phone, Mail, MessageSquare, AlertCircle, RefreshCw, Send, CheckSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LiveExportCounter from '../components/home/LiveExportCounter';
import { 
  SUBSCRIPTION_PLANS, 
  DEFAULT_SPOT_RATE_WITH_TAG, 
  DEFAULT_SPOT_RATE_WITHOUT_TAG 
} from '../lib/subscriptionPlans';

const cn = (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ');

export default function Home() {
  const nameInputId = useId();
  const phoneInputId = useId();
  const businessTypeSelectId = useId();
  const monthlyVolumeSelectId = useId();
  const notesTextareaId = useId();

  // ─── Interactive Hero Showcase Tabs ─────────────────────────────────────────
  type HeroPreviewTab = 'blueprint' | 'threed' | 'roster' | 'export' | 'orders';
  const [activeHeroTab, setActiveHeroTab] = useState<HeroPreviewTab>('blueprint');

  // ─── Business Categories Tab (Section 2: Built For Your Business) ───────────
  type BusinessCategory = 'manufacturer' | 'designer' | 'printing';
  const [activeCategory, setActiveCategory] = useState<BusinessCategory>('manufacturer');

  // ─── 5-Step Workflow Interactive Step (Section 3) ───────────────────────────
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(1);

  // ─── Product Feature Showcase Tabs (Section 4) ──────────────────────────────
  type ShowcaseTab = 'studio' | 'roster' | 'export' | 'orders' | 'tracking';
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<ShowcaseTab>('studio');

  // ─── Pricing Matrix Tab: 'monthly' | 'quarterly' | 'spot' ───────────────────
  const [pricingTab, setPricingTab] = useState<'monthly' | 'quarterly' | 'spot'>('monthly');

  // ─── Interactive Cost & Savings Calculator State ────────────────────────────
  const [calcMonthlyJerseys, setCalcMonthlyJerseys] = useState<number>(500);
  const [calcWithTag, setCalcWithTag] = useState<boolean>(true);

  // ─── FAQ Accordion State ────────────────────────────────────────────────────
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ─── Live Demo Booking Form State ───────────────────────────────────────────
  const [demoForm, setDemoForm] = useState({
    name: '',
    phone: '',
    businessType: 'Manufacturer',
    monthlyVolume: '200 - 1,000 Jerseys',
    notes: '',
  });
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // ─── Calculator Logic ───────────────────────────────────────────────────────
  // Replaces manual design labor with instant automated grading
  const manualHoursPerJersey = 0.20; // ~12 minutes manual Photoshop positioning per jersey
  const fivenestHoursPerJersey = 0.005; // Seconds per automated batch
  const estimatedManualHours = Math.round(calcMonthlyJerseys * manualHoursPerJersey);
  const estimatedFiveNestHours = Math.max(1, Math.round(calcMonthlyJerseys * fivenestHoursPerJersey));
  const estimatedHoursSaved = Math.max(0, estimatedManualHours - estimatedFiveNestHours);

  // Cost comparison
  const effectivePerPieceRate = calcWithTag ? DEFAULT_SPOT_RATE_WITH_TAG : DEFAULT_SPOT_RATE_WITHOUT_TAG;
  const estimatedExportCost = Math.round(calcMonthlyJerseys * effectivePerPieceRate);
  const estimatedManualDesignerCost = Math.round(calcMonthlyJerseys * 35); // ₹35 manual labor benchmark
  const estimatedMonthlySavings = Math.max(0, estimatedManualDesignerCost - estimatedExportCost);

  // Recommended plan based on monthly volume
  const getRecommendedPlan = (qty: number) => {
    if (qty <= 300) return SUBSCRIPTION_PLANS.find(p => p.id === 'monthly_starter');
    if (qty <= 900) return SUBSCRIPTION_PLANS.find(p => p.id === 'monthly_growth');
    if (qty <= 2000) return SUBSCRIPTION_PLANS.find(p => p.id === 'monthly_pro');
    return SUBSCRIPTION_PLANS.find(p => p.id === 'monthly_factory');
  };
  const recommendedPlan = getRecommendedPlan(calcMonthlyJerseys);

  // ─── Demo Booking Form Handler ──────────────────────────────────────────────
  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!demoForm.name.trim()) {
      setFormError('Please enter your full name or company name.');
      return;
    }
    const cleanPhone = demoForm.phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit WhatsApp or mobile number.');
      return;
    }

    setFormSubmitting(true);
    try {
      // Record lead locally & allow immediate WhatsApp sync
      const leadData = {
        name: demoForm.name.trim(),
        phone: cleanPhone,
        businessType: demoForm.businessType,
        monthlyVolume: demoForm.monthlyVolume,
        notes: demoForm.notes.trim(),
        timestamp: new Date().toISOString(),
      };

      try {
        const stored = localStorage.getItem('fivenest_demo_leads');
        const list = stored ? JSON.parse(stored) : [];
        list.push(leadData);
        localStorage.setItem('fivenest_demo_leads', JSON.stringify(list));
      } catch (err) {
        // localStorage fallback
      }

      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 900));
      setFormSubmitting(false);
      setFormSubmitted(true);
    } catch (err) {
      setFormSubmitting(false);
      setFormError('An error occurred. You can also message us directly on WhatsApp below.');
    }
  };

  const getWhatsAppDemoUrl = () => {
    const text = `Hi FiveNest Team, I would like to book a live demo of FiveNest.\n\nName: ${demoForm.name || 'Interested Buyer'}\nBusiness: ${demoForm.businessType}\nPhone: ${demoForm.phone || 'Provided via website'}\nMonthly Volume: ${demoForm.monthlyVolume}\nNote: ${demoForm.notes || 'Please arrange a personalized walkthrough.'}`;
    return `https://wa.me/918879228710?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="relative min-h-screen bg-[#F5F3EF] text-[#171717] font-sans selection:bg-[#E4572E] selection:text-white overflow-x-clip">
      {/* Sticky Premium Navigation */}
      <Navbar />

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 1: HERO — REPOSITIONED AS CONNECTED PRODUCTION & BUSINESS OS
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Technical Grid Pattern & Subtle Glows */}
        <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[450px] bg-gradient-to-tr from-[#E4572E]/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          
          {/* Top Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span className="badge-pill px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-xs border border-[#E4572E]/25 bg-white/95 text-[#171717]">
              <Sparkles size={14} className="text-[#E4572E] animate-pulse" />
              <span>Connected Sportswear Production &amp; Order Platform</span>
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#171717] tracking-tight leading-[1.08] mb-6"
          >
            From Order to Print-Ready Jersey. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E4572E] via-[#EA580C] to-[#C2410C]">
              All in One Place.
            </span>
          </motion.h1>

          {/* Supporting Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-[#52525B] max-w-3xl mx-auto leading-relaxed mb-10 font-normal"
          >
            Streamline your sportswear business with FiveNest. Manage orders, customize designs in 2D and 3D, automate team names, numbers and sizes, and prepare print-ready files—all from one connected workflow.
          </motion.p>

          {/* Primary & Secondary Calls to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3.5 justify-center items-center mb-12"
          >
            <a
              href="#demo"
              className="btn-primary w-full sm:w-auto px-8 py-4 text-sm sm:text-base font-bold shadow-brand flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Calendar size={18} />
              <span>Book a Live Demo</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="#workflow"
              className="btn-secondary w-full sm:w-auto px-7 py-4 text-sm sm:text-base font-bold bg-white hover:bg-neutral-50 border border-[#E8E4DE] text-[#171717] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Play size={16} className="text-[#E4572E] fill-[#E4572E]" />
              <span>See How It Works</span>
            </a>

            <Link
              to="/production"
              className="text-xs sm:text-sm font-bold text-[#52525B] hover:text-[#E4572E] px-4 py-2.5 transition-colors flex items-center gap-1.5"
            >
              <span>Explore Production Studio</span>
              <ArrowUpRight size={15} />
            </Link>
          </motion.div>

          {/* Technical Quality Standards (Verified Technical Capabilities) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-6 border-t border-[#E8E4DE]"
          >
            <div className="p-3.5 rounded-2xl bg-white/80 border border-[#E8E4DE] text-left">
              <p className="text-xl sm:text-2xl font-black text-[#E4572E]">300 DPI CMYK</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] mt-0.5">
                Lossless Individual Panels
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 border border-[#E8E4DE] text-left">
              <p className="text-xl sm:text-2xl font-black text-[#171717]">10mm Bleed</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] mt-0.5">
                Pre-Applied Cut &amp; Sew Margins
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 border border-[#E8E4DE] text-left">
              <p className="text-xl sm:text-2xl font-black text-[#E4572E]">XS to 5XL</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] mt-0.5">
                Zero-Typo Vector Auto-Grading
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 border border-[#E8E4DE] text-left">
              <p className="text-xl sm:text-2xl font-black text-[#171717]">Universal RIP</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] mt-0.5">
                Wasatch, NeoStampa, Mimaki, Epson
              </p>
            </div>
          </motion.div>

        </div>

        {/* ── BROWSER-STYLE AUTHENTIC APPLICATION PREVIEW ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-14">
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#E8E4DE] shadow-soft-lg overflow-hidden">
            
            {/* Browser Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8E4DE]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F5F3EF] border border-[#E8E4DE] text-[11px] font-mono text-[#71717A] ml-2">
                  <span className="text-emerald-600 font-bold">https://</span>
                  <span>app.fivenest.in/production</span>
                </div>
              </div>

              {/* Feature Preview Tabs */}
              <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-[#F5F3EF] border border-[#E8E4DE]">
                {[
                  { id: 'blueprint', label: '2D Multi-Panel Canvas' },
                  { id: 'threed', label: '3D Realtime Proof' },
                  { id: 'roster', label: 'Team Sizing & Roster' },
                  { id: 'export', label: 'Print-Ready Export' },
                  { id: 'orders', label: 'Orders & Ledgers' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveHeroTab(t.id as HeroPreviewTab)}
                    className={cn(
                      'px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                      activeHeroTab === t.id
                        ? 'bg-[#E4572E] text-white shadow-xs'
                        : 'text-[#686661] hover:text-[#171717]'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB PREVIEW CONTENT CONTAINER */}
            <div className="mt-4 bg-[#171717] rounded-2xl p-5 sm:p-8 text-white relative overflow-hidden min-h-[380px] flex flex-col justify-between border border-neutral-800">
              <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />

              {/* 1. 2D Multi-Panel Canvas */}
              {activeHeroTab === 'blueprint' && (
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div>
                      <span className="text-[11px] font-mono text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                        MULTI-PANEL SUBLIMATION BLUEPRINT
                      </span>
                      <h4 className="text-lg font-bold text-white mt-1">
                        Precise Sublimation Panel Geometry (Front, Back, Sleeves, Collar &amp; A4)
                      </h4>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">10mm Seam Bleed Pre-Applied</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="rounded-xl border border-white/15 bg-gradient-to-b from-neutral-800/80 to-neutral-900 p-4 h-48 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-neutral-300">Front Panel</span>
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-neutral-300">58x72cm</span>
                      </div>
                      <div className="my-auto text-center">
                        <div className="w-10 h-10 mx-auto rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-sm mb-1.5">
                          FN
                        </div>
                        <p className="text-xs font-semibold text-neutral-200">Team Crest &amp; Sponsor</p>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono text-center bg-emerald-500/10 py-0.5 rounded border border-emerald-500/20">
                        FREE PANEL (₹0.00)
                      </span>
                    </div>

                    <div className="rounded-xl border border-orange-500/40 bg-gradient-to-b from-orange-950/40 to-neutral-900 p-4 h-48 flex flex-col justify-between ring-1 ring-orange-500/20">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-orange-300 font-bold">Back Panel</span>
                        <span className="text-[10px] bg-orange-500/20 px-1.5 py-0.5 rounded text-orange-200">60x75cm</span>
                      </div>
                      <div className="my-auto text-center">
                        <p className="text-xs font-black tracking-widest text-neutral-300">VIRAT</p>
                        <p className="text-4xl font-black text-orange-400 leading-none my-1">18</p>
                        <span className="text-[10px] text-neutral-400 font-mono">Dynamic Scaling</span>
                      </div>
                      <span className="text-[10px] text-orange-400 font-mono text-center bg-orange-500/10 py-0.5 rounded border border-orange-500/20 font-bold">
                        Billed on Export (₹3.50)
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/15 bg-gradient-to-b from-neutral-800/80 to-neutral-900 p-4 h-48 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-neutral-300">Left Sleeve</span>
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-neutral-300">Left Tag</span>
                      </div>
                      <div className="my-auto text-center">
                        <div className="w-8 h-8 mx-auto rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs mb-1.5">
                          LHS
                        </div>
                        <p className="text-xs font-semibold text-neutral-200">Tournament Patch</p>
                      </div>
                      <span className="text-[10px] text-blue-400 font-mono text-center bg-blue-500/10 py-0.5 rounded border border-blue-500/20">
                        LEFT SLEEVE STAMP
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/15 bg-gradient-to-b from-neutral-800/80 to-neutral-900 p-4 h-48 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-neutral-300">Right Sleeve</span>
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-neutral-300">Right Tag</span>
                      </div>
                      <div className="my-auto text-center">
                        <div className="w-8 h-8 mx-auto rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xs mb-1.5">
                          RHS
                        </div>
                        <p className="text-xs font-semibold text-neutral-200">Brand Tag &amp; Stripe</p>
                      </div>
                      <span className="text-[10px] text-red-400 font-mono text-center bg-red-500/10 py-0.5 rounded border border-red-500/20">
                        RIGHT SLEEVE STAMP
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. 3D Realtime Proof */}
              {activeHeroTab === 'threed' && (
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                      INTERACTIVE 3D PROJECTION
                    </span>
                    <h4 className="text-xl font-bold text-white mt-2 mb-3">
                      Digital 3D Sportswear Proofing with 360° Inspection
                    </h4>
                    <p className="text-neutral-300 text-sm leading-relaxed mb-4">
                      Inspect front chest logos, collar folds, raglan sleeve seams, and rear name placement in real time before sending files to the print queue.
                    </p>
                    <ul className="space-y-2 text-xs text-neutral-300 mb-4">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                        <span>WebGL 3D garment simulation right in your browser</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                        <span>Shareable client proof approvals to eliminate customer arguments</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                        <span>Zero Photoshop 3D mockups required</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center relative flex flex-col items-center justify-center min-h-[220px]">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#E4572E] to-amber-500 flex items-center justify-center text-white shadow-lg mb-3">
                      <Shirt size={48} />
                    </div>
                    <p className="font-bold text-white text-sm">3D Interactive Jersey Simulation</p>
                    <p className="text-xs text-neutral-400 mt-1">360° Orbit Rotation • Real-Time Seam Check</p>
                    <span className="mt-3 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-[11px] font-mono">
                      ● Active WebGL Engine
                    </span>
                  </div>
                </div>
              )}

              {/* 3. Team Sizing & Roster */}
              {activeHeroTab === 'roster' && (
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        DYNAMIC SQUAD ROSTER ENGINE
                      </span>
                      <h4 className="text-lg font-bold text-white mt-1">
                        1-Click Bulk Team Name &amp; Size Auto-Grading (Junior to 5XL)
                      </h4>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">Excel/CSV Import Ready</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    {[
                      { name: 'VIRAT KOHLI', num: '18', size: 'Size 42 (L)', chest: '42"', status: 'Proportioned' },
                      { name: 'ROHIT SHARMA', num: '45', size: 'Size 44 (XL)', chest: '44"', status: 'Proportioned' },
                      { name: 'HARDIK PANDYA', num: '33', size: 'Size 40 (M)', chest: '40"', status: 'Proportioned' },
                    ].map((row, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                          <span className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-sm">
                            {row.num}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[11px]">
                            {row.size}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm tracking-wide">{row.name}</p>
                          <p className="text-[11px] text-neutral-400">Chest: {row.chest}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-neutral-800 flex justify-between items-center text-[10px]">
                          <span className="text-emerald-400 font-bold">● {row.status}</span>
                          <span className="text-neutral-500">Vector Curves</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-wrap justify-between items-center text-xs text-neutral-400">
                    <span>Authentic athletic fonts: Jersey M54, Barcelona 2013 HD, Impact, Arial Bold, Eaglore 2</span>
                    <span className="text-emerald-400 font-bold">Zero Typo Risk Guaranteed</span>
                  </div>
                </div>
              )}

              {/* 4. Print-Ready Export */}
              {activeHeroTab === 'export' && (
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                      <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                        RIP-READY EXPORT PACKAGE
                      </span>
                      <h4 className="text-lg font-bold text-white mt-1">
                        Individual High-Res Panels Structured Cleanly by Size &amp; Player
                      </h4>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono font-bold">300 DPI CMYK TIFF / PDF</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <div className="flex justify-between items-center text-[11px] font-bold text-white mb-1">
                        <span>40 = 2 F.jpg</span>
                        <span className="text-emerald-400 text-[10px]">Front</span>
                      </div>
                      <p className="text-neutral-400 text-[10px]">Chest Logo &amp; Bleed</p>
                      <span className="text-emerald-400 text-[10px] mt-2 block">FREE PANEL</span>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-900 border border-orange-500/30">
                      <div className="flex justify-between items-center text-[11px] font-bold text-white mb-1">
                        <span>40_VIRAT_18.jpg</span>
                        <span className="text-orange-400 text-[10px]">Back</span>
                      </div>
                      <p className="text-neutral-400 text-[10px]">Custom Name &amp; Number</p>
                      <span className="text-orange-400 text-[10px] mt-2 block">Billed: ₹3.50</span>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <div className="flex justify-between items-center text-[11px] font-bold text-white mb-1">
                        <span>40 = 2 Left Sleeve.jpg</span>
                        <span className="text-blue-400 text-[10px]">Left</span>
                      </div>
                      <p className="text-neutral-400 text-[10px]">Left Sleeve Tagged</p>
                      <span className="text-emerald-400 text-[10px] mt-2 block">FREE PANEL</span>
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <div className="flex justify-between items-center text-[11px] font-bold text-white mb-1">
                        <span>40 = 2 Right Sleeve.jpg</span>
                        <span className="text-red-400 text-[10px]">Right</span>
                      </div>
                      <p className="text-neutral-400 text-[10px]">Right Sleeve Tagged</p>
                      <span className="text-emerald-400 text-[10px] mt-2 block">FREE PANEL</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-wrap justify-between items-center text-xs text-neutral-400">
                    <span>Directly compatible with Wasatch, NeoStampa, PhotoPrint, Mimaki, Epson Edge</span>
                    <span className="text-neutral-300">Roll Nesting also available as optional studio add-on</span>
                  </div>
                </div>
              )}

              {/* 5. Orders & Ledgers */}
              {activeHeroTab === 'orders' && (
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        FACTORY OPERATIONS HUB
                      </span>
                      <h4 className="text-lg font-bold text-white mt-1">
                        Real-Time Job Sheets, Factory Ledgers &amp; GST Payment Links
                      </h4>
                    </div>
                    <Link to="/orders" className="text-xs text-orange-400 hover:underline flex items-center gap-1 font-bold">
                      Open Live Portal <ArrowRight size={13} />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <p className="text-[10px] text-neutral-400 uppercase font-mono">Active Orders</p>
                      <p className="text-xl font-black text-white mt-0.5">18 Jobs</p>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <p className="text-[10px] text-neutral-400 uppercase font-mono">Queued Jerseys</p>
                      <p className="text-xl font-black text-orange-400 mt-0.5">1,480 Pcs</p>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <p className="text-[10px] text-neutral-400 uppercase font-mono">Floor Cutting Sheets</p>
                      <p className="text-xl font-black text-emerald-400 mt-0.5">Auto-Generated</p>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <p className="text-[10px] text-neutral-400 uppercase font-mono">GST Billing</p>
                      <p className="text-xl font-black text-blue-400 mt-0.5">Razorpay Links</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400">
                    Included automatically with plans or wallet recharges of ₹5,000 and above.
                  </p>
                </div>
              )}

              {/* Bottom Quick Bar */}
              <div className="pt-4 border-t border-neutral-800 flex flex-wrap justify-between items-center text-xs text-neutral-400 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Web-based platform • Runs in any modern browser on PC, Mac or tablet</span>
                </div>
                <div className="flex items-center gap-4">
                  <a href="#demo" className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer">
                    Book Walkthrough Demo <ArrowRight size={13} />
                  </a>
                  <Link to="/production" className="text-white hover:underline font-bold flex items-center gap-1">
                    Try Studio <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 2: IDENTIFY YOUR BUSINESS (SOLUTIONS FOR INDIAN SPORTSWEAR UNITS)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="solutions" className="py-20 relative bg-white border-t border-[#E8E4DE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="badge-pill mb-3 inline-block font-bold">
              Tailored For Your Workflow
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
              Built for Every Sportswear Business Role
            </h2>
            <p className="text-base sm:text-lg text-[#52525B] leading-relaxed">
              Whether you run a high-volume manufacturing factory, create custom athletic designs, or manage sublimation printers, FiveNest provides the dedicated tools you need.
            </p>

            {/* Selectable Role Switcher */}
            <div className="inline-flex p-1.5 rounded-2xl bg-[#F5F3EF] border border-[#E8E4DE] mt-6 flex-wrap justify-center">
              {[
                { id: 'manufacturer', label: 'Manufacturer' },
                { id: 'designer', label: 'Sportswear Designer' },
                { id: 'printing', label: 'Printing Shop Owner' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as BusinessCategory)}
                  className={cn(
                    'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
                    activeCategory === cat.id
                      ? 'bg-[#E4572E] text-white shadow-xs'
                      : 'text-[#52525B] hover:text-[#171717]'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Interactive Solution Cards / Tabs */}
          <div className="bg-[#FAF9F6] rounded-3xl border border-[#E8E4DE] p-6 sm:p-10 shadow-xs">
            
            {/* Manufacturer Details */}
            {activeCategory === 'manufacturer' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-[#E4572E] text-xs font-bold uppercase">
                    <Package size={14} /> For Sportswear Manufacturers
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#171717]">
                    End-to-End Control from Wholesale Orders to Floor Cutting
                  </h3>
                  <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                    Stop chasing disorganised WhatsApp lists and dealing with costly misprint reprints. Coordinate multi-tournament orders, manage sizing distributions, and generate accurate floor job sheets in minutes.
                  </p>
                  
                  <div className="space-y-3 pt-2">
                    {[
                      'Organize customer & team orders in a unified ledger',
                      'Manage jersey sizes and player information with zero manual retyping',
                      'Coordinate production activity & issue floor cutting job sheets',
                      'Prepare and export 300 DPI print files in bulk (organized size folders)',
                      'Track associated billing, payments, and customer balances automatically',
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-sm text-[#171717] font-medium">
                        <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex flex-wrap gap-3">
                    <a href="#demo" className="btn-primary px-6 py-3 text-xs sm:text-sm font-bold shadow-brand">
                      Book Manufacturer Demo
                    </a>
                    <Link to="/orders" className="btn-secondary px-6 py-3 text-xs sm:text-sm font-bold bg-white border border-[#E8E4DE]">
                      Explore Order Management
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#E8E4DE] shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-[#E8E4DE]">
                    <span className="text-xs font-bold text-[#171717] uppercase tracking-wider">Manufacturer Dashboard Specs</span>
                    <span className="text-xs text-emerald-600 font-bold">● Active Workflow</span>
                  </div>
                  <div className="space-y-2.5 text-xs text-[#52525B]">
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">Floor Job Sheets:</span>
                      <span className="font-bold text-[#171717]">Yardage, counts &amp; size split</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">Roster Grading:</span>
                      <span className="font-bold text-emerald-700">100% Vector (Junior to 5XL)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">Wholesale Portal:</span>
                      <span className="font-bold text-[#171717]">Client self-service roster input</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">Seam Allowances:</span>
                      <span className="font-bold text-[#171717]">10mm bleed pre-applied</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Designer Details */}
            {activeCategory === 'designer' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-bold uppercase">
                    <Sliders size={14} /> For Sportswear Designers
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#171717]">
                    Vector Precision, Instant 2D/3D Mockups &amp; Zero Repetitive Typing
                  </h3>
                  <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                    Free yourself from endless hours of copy-pasting numbers and nudging layers in Photoshop. Upload your vector artwork once, let FiveNest grade team rosters automatically, and share photorealistic 3D proofs with clients.
                  </p>
                  
                  <div className="space-y-3 pt-2">
                    {[
                      'Work with master sportswear artwork in AI, EPS, SVG or 300 DPI PNG',
                      'Inspect multi-panel blueprints and live 360° 3D jersey proofs',
                      'Automate repetitive player name, squad number & size curve scaling',
                      'Prepare print-ready individual panels with exact 10mm seam bleeds',
                      'Track client design approvals and design service charges seamlessly',
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-sm text-[#171717] font-medium">
                        <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex flex-wrap gap-3">
                    <Link to="/production" className="btn-primary px-6 py-3 text-xs sm:text-sm font-bold shadow-brand">
                      Launch Designer Studio
                    </Link>
                    <a href="#demo" className="btn-secondary px-6 py-3 text-xs sm:text-sm font-bold bg-white border border-[#E8E4DE]">
                      Book Designer Demo
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#E8E4DE] shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-[#E8E4DE]">
                    <span className="text-xs font-bold text-[#171717] uppercase tracking-wider">Designer Engine Specs</span>
                    <span className="text-xs text-blue-600 font-bold">● Vector Curves</span>
                  </div>
                  <div className="space-y-2.5 text-xs text-[#52525B]">
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">3D WebGL Proof:</span>
                      <span className="font-bold text-[#171717]">Real-time interactive inspection</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">Athletic Fonts:</span>
                      <span className="font-bold text-[#171717]">Jersey M54, Barcelona, Impact</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">Text Effects:</span>
                      <span className="font-bold text-[#171717]">Arches, double outlines, drop shadows</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">No Photoshop Required:</span>
                      <span className="font-bold text-emerald-700">Runs directly in browser</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Printing Owner Details */}
            {activeCategory === 'printing' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-800 text-xs font-bold uppercase">
                    <Printer size={14} /> For Sublimation Print Shop Owners
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#171717]">
                    Drop-in RIP Compatibility, Ink Efficiency &amp; Automated Billing
                  </h3>
                  <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                    Keep your wide-format plotters running continuously without file bottlenecks. FiveNest exports clean, high-resolution panel files organized by size and player, ready for immediate drag-and-drop into Wasatch, NeoStampa, or PhotoPrint.
                  </p>
                  
                  <div className="space-y-3 pt-2">
                    {[
                      'Organize printing jobs across machines, fabric types & roll widths',
                      'Manage per-meter / per-jersey service pricing and ink consumption',
                      'Track live job statuses from file receipt to heat-press dispatch',
                      'Handle GST invoices and Razorpay instant payment links effortlessly',
                      'Export organized 300 DPI CMYK files directly compatible with any RIP',
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-sm text-[#171717] font-medium">
                        <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex flex-wrap gap-3">
                    <a href="#demo" className="btn-primary px-6 py-3 text-xs sm:text-sm font-bold shadow-brand">
                      Book Print Shop Demo
                    </a>
                    <a href="#pricing" className="btn-secondary px-6 py-3 text-xs sm:text-sm font-bold bg-white border border-[#E8E4DE]">
                      View Token &amp; Subscription Pricing
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#E8E4DE] shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-[#E8E4DE]">
                    <span className="text-xs font-bold text-[#171717] uppercase tracking-wider">Print Operator Specs</span>
                    <span className="text-xs text-emerald-600 font-bold">● 300 DPI CMYK</span>
                  </div>
                  <div className="space-y-2.5 text-xs text-[#52525B]">
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">Supported RIPs:</span>
                      <span className="font-bold text-[#171717]">Wasatch, NeoStampa, Mimaki, Epson</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">Output Packaging:</span>
                      <span className="font-bold text-[#171717]">Size-sorted ZIP archives</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">Roll Nesting:</span>
                      <span className="font-bold text-[#171717]">Optional automated studio add-on</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                      <span className="font-semibold">Payment Links:</span>
                      <span className="font-bold text-emerald-700">UPI / QR instant collections</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Practical Note: Roles are not mutually exclusive */}
            <div className="mt-8 pt-6 border-t border-[#E8E4DE] text-center text-xs text-[#71717A]">
              <span className="font-bold text-[#171717]">Note:</span> Many sportswear businesses in India handle design, printing, and manufacturing under one roof. FiveNest connects all these operations into a single shared database so your entire team stays aligned.
            </div>

          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 3: THE COMPLETE FIVENEST WORKFLOW (HORIZONTAL PIPELINE / TIMELINE)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="workflow" className="py-20 relative bg-[#EFECE6]/50 border-t border-[#E8E4DE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="badge-pill mb-3 inline-block font-bold">
              Connected Pipeline
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
              The Complete FiveNest Workflow
            </h2>
            <p className="text-base sm:text-lg text-[#52525B] leading-relaxed">
              From the moment an order arrives to the final cut-and-sew heat press, FiveNest links every step into a connected digital thread.
            </p>
          </div>

          {/* 5-Step Connected Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              {
                step: 1,
                title: 'Receive & Manage Orders',
                desc: 'Capture wholesale customer details, tournament specs, fabric choices, and roster files in a structured order portal.',
                tag: 'Step 01',
              },
              {
                step: 2,
                title: 'Design & Preview in 2D/3D',
                desc: 'Map master vector graphics across front, back, sleeves, collar & ribbing with real-time 360° 3D digital proofing.',
                tag: 'Step 02',
              },
              {
                step: 3,
                title: 'Automate Team Rosters',
                desc: 'Upload Excel/CSV lists to automatically scale player names, squad numbers, and sizes across junior to 5XL.',
                tag: 'Step 03',
              },
              {
                step: 4,
                title: 'Prepare Print-Ready Files',
                desc: 'Generate 300 DPI CMYK individual panels with 10mm pre-applied bleeds, sorted neatly into size-wise ZIP folders.',
                tag: 'Step 04',
              },
              {
                step: 5,
                title: 'Track Production & Billing',
                desc: 'Print floor cutting job sheets, update factory P&L ledgers, issue GST tax invoices, and collect UPI payments.',
                tag: 'Step 05',
              },
            ].map((s) => (
              <div
                key={s.step}
                className={cn(
                  'p-5 rounded-2xl border transition-all flex flex-col justify-between',
                  activeWorkflowStep === s.step
                    ? 'bg-white border-[#E4572E] ring-2 ring-[#E4572E]/15 shadow-sm'
                    : 'bg-white/70 border-[#E8E4DE] hover:border-neutral-300'
                )}
                onClick={() => setActiveWorkflowStep(s.step)}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-[#E4572E]/10 text-[#E4572E] font-mono">
                      {s.tag}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#E4572E]" />
                  </div>
                  <h4 className="text-base font-extrabold text-[#171717] mb-2">{s.title}</h4>
                  <p className="text-xs text-[#52525B] leading-relaxed">{s.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8E4DE]/60 text-[11px] font-bold text-[#E4572E] flex items-center gap-1">
                  <span>Step details</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#E8E4DE] text-sm font-bold text-[#171717] hover:text-[#E4572E] hover:border-[#E4572E] transition-all shadow-xs cursor-pointer"
            >
              <Calendar size={16} className="text-[#E4572E]" />
              <span>Book a Live Demo of the Complete Workflow</span>
              <ArrowRight size={14} />
            </a>
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 4: INTERACTIVE PRODUCT FEATURE SHOWCASE
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="showcase" className="py-20 relative bg-white border-t border-[#E8E4DE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="badge-pill mb-3 inline-block font-bold">
              Software Capabilities
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
              Explore FiveNest Production Features
            </h2>
            <p className="text-base sm:text-lg text-[#52525B] leading-relaxed">
              Every tool in FiveNest was built specifically around the real needs of Indian sublimation factories and sportswear print shops.
            </p>

            {/* 5 Distinct Feature Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-[#F5F3EF] border border-[#E8E4DE] mt-8 justify-center">
              {[
                { id: 'studio', label: 'Production Studio', icon: Laptop },
                { id: 'roster', label: 'Automated Sizing & Rosters', icon: Users },
                { id: 'export', label: 'Smart Nesting & Export', icon: Download },
                { id: 'orders', label: 'Orders & Billing', icon: Package },
                { id: 'tracking', label: 'Production Tracking', icon: BarChart3 },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveShowcaseTab(tab.id as ShowcaseTab)}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer',
                      activeShowcaseTab === tab.id
                        ? 'bg-[#E4572E] text-white shadow-xs'
                        : 'text-[#686661] hover:text-[#171717]'
                    )}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feature Tab Container */}
          <div className="bg-[#FAF9F6] rounded-3xl p-6 sm:p-10 border border-[#E8E4DE] shadow-xs">
            
            {/* 1. Production Studio */}
            {activeShowcaseTab === 'studio' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-[#E4572E] text-xs font-bold uppercase">
                    <Laptop size={14} /> Core Studio Engine
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#171717]">
                    Multi-Panel Sublimation Blueprint &amp; 3D Proofing
                  </h3>
                  <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                    Upload your master artwork in vector AI, EPS, SVG, or 300 DPI PNG. FiveNest maps panels with millimetre accuracy—chest, back, sleeves, collar, and side panels—while simulating the finished look in 3D WebGL.
                  </p>
                  
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0 mt-0.5" />
                      <span>Real-time 3D jersey rotation and digital proof preview</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0 mt-0.5" />
                      <span>Pre-calibrated 10mm sewing seam allowances and heat-press bleed lines</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-[#E4572E] flex-shrink-0 mt-0.5" />
                      <span>Support for both set-in and raglan sleeve pattern geometries</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link to="/production" className="btn-primary px-6 py-3 text-xs sm:text-sm font-bold shadow-brand">
                      Launch Studio Interface
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#171717] rounded-2xl p-6 text-white border border-neutral-800 space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono text-neutral-400 pb-3 border-b border-neutral-800">
                    <span>PANEL BLUEPRINT SPECIFICATION</span>
                    <span className="text-orange-400">300 DPI CMYK</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <span className="text-neutral-400 block mb-1">FRONT PANEL</span>
                      <span className="text-white font-bold">58 x 72 cm</span>
                      <span className="text-emerald-400 text-[10px] block mt-1">FREE PANEL</span>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <span className="text-neutral-400 block mb-1">BACK PANEL</span>
                      <span className="text-white font-bold">60 x 75 cm</span>
                      <span className="text-orange-400 text-[10px] block mt-1">Billed: ₹3.50</span>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <span className="text-neutral-400 block mb-1">SLEEVES (L+R)</span>
                      <span className="text-white font-bold">24 x 42 cm</span>
                      <span className="text-emerald-400 text-[10px] block mt-1">FREE PANELS</span>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                      <span className="text-neutral-400 block mb-1">COLLAR RIBBING</span>
                      <span className="text-white font-bold">18 x 4.5 in</span>
                      <span className="text-emerald-400 text-[10px] block mt-1">FREE PANEL</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Automated Sizing & Rosters */}
            {activeShowcaseTab === 'roster' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-bold uppercase">
                    <Users size={14} /> Team Roster Automation
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#171717]">
                    Zero-Typo Name &amp; Number Auto-Grading (Junior to 5XL)
                  </h3>
                  <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                    Paste your tournament roster from Excel or CSV. FiveNest automatically adapts artwork proportions and text curvature across every garment size—so graphics stay perfectly balanced on an 18 junior jersey or a 60 (5XL) kit.
                  </p>
                  
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Dynamic vector font arching, dual outline strokes &amp; drop shadows</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Built-in athletic fonts: Jersey M54, Barcelona 2013 HD, Impact, Arial Bold, Eaglore 2</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Automatic duplicate number and spelling validation</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link to="/production" className="btn-primary px-6 py-3 text-xs sm:text-sm font-bold shadow-brand">
                      Test Roster Grading in Studio
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#171717] rounded-2xl p-6 text-white border border-neutral-800 space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono text-neutral-400 pb-3 border-b border-neutral-800">
                    <span>SQUAD BATCH ENGINE</span>
                    <span className="text-emerald-400">100% TYPO-PROOF</span>
                  </div>
                  {[
                    { num: '45', name: 'ROHIT SHARMA', size: 'Size 44 (XL)', chest: '44"' },
                    { num: '18', name: 'VIRAT KOHLI', size: 'Size 42 (L)', chest: '42"' },
                    { num: '33', name: 'HARDIK PANDYA', size: 'Size 40 (M)', chest: '40"' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between items-center text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center">
                          {row.num}
                        </span>
                        <div>
                          <p className="text-white font-bold">{row.name}</p>
                          <p className="text-[10px] text-neutral-400">Chest: {row.chest}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-white/10 text-white font-bold text-[11px]">
                        {row.size}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Smart Nesting & Export */}
            {activeShowcaseTab === 'export' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-800 text-xs font-bold uppercase">
                    <Download size={14} /> Industrial File Export
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#171717]">
                    1-Click High-Res RIP Exports (Individual Panels &amp; Roll Nesting)
                  </h3>
                  <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                    Indian sublimation factories overwhelmingly prefer clean individual panel files per jersey. FiveNest outputs separate Front, Back (with custom player name &amp; number), Left Sleeve, Right Sleeve, and Collar files organized neatly by size.
                  </p>
                  
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Individual 300 DPI CMYK TIFF / PDF panels ready for RIP drag-and-drop</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Explicit Left and Right sleeve watermarks and file names</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Optional continuous Roll Nesting add-on available anytime</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link to="/production" className="btn-primary px-6 py-3 text-xs sm:text-sm font-bold shadow-brand">
                      Test Export in Studio
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#171717] rounded-2xl p-6 text-white border border-neutral-800 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-neutral-400 pb-3 border-b border-neutral-800">
                    <span>OUTPUT FORMAT SPECIFICATIONS</span>
                    <span className="text-emerald-400">300 DPI LOSSLESS</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between">
                    <span className="text-neutral-400">Front Panel:</span>
                    <span className="text-white font-bold">40 = 2 F.jpg</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between">
                    <span className="text-neutral-400">Back Panel:</span>
                    <span className="text-orange-400 font-bold">40_VIRAT_18.jpg</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between">
                    <span className="text-neutral-400">Left Sleeve:</span>
                    <span className="text-blue-400 font-bold">40 = 2 Left Sleeve.jpg</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between">
                    <span className="text-neutral-400">Right Sleeve:</span>
                    <span className="text-red-400 font-bold">40 = 2 Right Sleeve.jpg</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between">
                    <span className="text-neutral-400">Seam Bleed:</span>
                    <span className="text-emerald-400 font-bold">10mm Calibrated Margins</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Orders & Billing */}
            {activeShowcaseTab === 'orders' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 text-xs font-bold uppercase">
                    <Package size={14} /> Commercial Hub
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#171717]">
                    Self-Service Client Portals, GST Invoicing &amp; UPI Payment Links
                  </h3>
                  <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                    Say goodbye to messy WhatsApp communications and missing sizes. Give wholesale clients a dedicated portal link to submit player rosters, approve proofs, and make advance payments via Razorpay UPI.
                  </p>
                  
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Instant GST-compliant tax invoices with HSN codes</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Razorpay payment links for GPay, PhonePe, and Paytm UPI collections</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Real-time customer receivables tracking with party ledgers</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link to="/orders" className="btn-primary px-6 py-3 text-xs sm:text-sm font-bold shadow-brand">
                      Open Order Portal
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-[#E8E4DE] shadow-xs space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E8E4DE]">
                    <span className="font-bold text-[#171717] uppercase">COMMERCIAL SPECS</span>
                    <span className="text-emerald-700 font-bold">● GST Ready</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                    <span className="text-[#52525B]">Customer Portals:</span>
                    <span className="font-bold text-[#171717]">Self-service roster input &amp; approvals</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                    <span className="text-[#52525B]">Tax Invoicing:</span>
                    <span className="font-bold text-[#171717]">Automated GST bills + HSN</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                    <span className="text-[#52525B]">Payment Gateways:</span>
                    <span className="font-bold text-[#171717]">Razorpay UPI, QR &amp; NetBanking</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                    <span className="text-[#52525B]">Included With:</span>
                    <span className="font-bold text-orange-600">Plans or balances ≥ ₹5,000</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Production Tracking */}
            {activeShowcaseTab === 'tracking' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold uppercase">
                    <BarChart3 size={14} /> Factory Floor Operations
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#171717]">
                    Printable Cutting Sheets, Floor Status &amp; Real-Time P&amp;L
                  </h3>
                  <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                    Give your floor operators exact cutting job sheets with fabric yardage, panel counts, size distributions, and heat-press temperature guidelines so nothing gets misplaced in the workshop.
                  </p>
                  
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Printable factory cutting job sheets with heat-press instructions</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Live status tracking: Order Received → In Production → Dispatched</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-[#171717]">
                      <CheckCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Automated factory expenses and monthly P&amp;L ledgers</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link to="/orders" className="btn-primary px-6 py-3 text-xs sm:text-sm font-bold shadow-brand">
                      View Factory Tracking
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-[#E8E4DE] shadow-xs space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E8E4DE]">
                    <span className="font-bold text-[#171717] uppercase">FLOOR SPECIFICATIONS</span>
                    <span className="text-amber-700 font-bold">● Active Tracking</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                    <span className="text-[#52525B]">Job Sheet Specs:</span>
                    <span className="font-bold text-[#171717]">Fabric meters, collar count &amp; size split</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                    <span className="text-[#52525B]">Cutting Accuracy:</span>
                    <span className="font-bold text-[#171717]">Pre-calibrated seam allowances</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F5F3EF] flex justify-between">
                    <span className="text-[#52525B]">P&amp;L Ledgers:</span>
                    <span className="font-bold text-[#171717]">Paper, ink &amp; fabric cost tracking</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 5: BEFORE VS AFTER FIVENEST (PRACTICAL COMPARISON FOR WORKSHOPS)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 relative bg-[#F5F3EF] border-t border-[#E8E4DE]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center mb-14">
            <span className="badge-pill mb-3 inline-block font-bold">
              Practical Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight mb-3">
              Before FiveNest vs. With FiveNest
            </h2>
            <p className="text-sm sm:text-base text-[#52525B]">
              How moving from manual Photoshop nudging to connected automation transforms your daily production.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8E4DE] shadow-soft overflow-hidden">
            <div className="grid grid-cols-2 p-4 sm:p-5 bg-[#FAF9F6] border-b border-[#E8E4DE] text-xs font-black uppercase tracking-wider text-[#52525B]">
              <span className="text-neutral-500">Without FiveNest (Manual Workflow)</span>
              <span className="text-[#E4572E]">With FiveNest Platform</span>
            </div>

            {[
              {
                before: 'Repetitive manual data entry copy-pasting squad names & numbers one by one into Photoshop layers.',
                after: '1-Click team roster batch import directly from Excel/CSV with instant vector curve alignment.',
              },
              {
                before: 'Manual jersey sizing & placement requiring graphic designers to spend hours resizing text per kit size.',
                after: 'Automated vector proportion auto-grading across all garment sizes from junior 18 up to 5XL.',
              },
              {
                before: 'Multiple disconnected file preparation steps with high human error and expensive fabric reprint waste.',
                after: 'Organized 300 DPI CMYK individual panels with 10mm pre-applied bleeds, sorted neatly into size folders.',
              },
              {
                before: 'Chaotic order coordination across scattered WhatsApp screenshots, voice notes, and paper job slips.',
                after: 'Connected wholesale customer portal with digital proof approvals and verified squad entries.',
              },
              {
                before: 'Disconnected production and billing info leading to uncollected payments and disputed quantities.',
                after: 'Complete factory visibility with printable cutting job sheets, automated GST bills & party ledgers.',
              },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-2 p-4 sm:p-5 border-b border-[#E8E4DE] last:border-0 text-xs sm:text-sm items-start gap-4">
                <div className="text-[#71717A] leading-relaxed">
                  <span className="text-red-500 font-bold mr-1.5">✕</span>
                  <span>{row.before}</span>
                </div>
                <div className="text-[#171717] font-semibold leading-relaxed flex items-start gap-1.5">
                  <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{row.after}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 6: PRICING & EXPORT CREDITS (RECONCILED MODEL)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 relative bg-white border-t border-[#E8E4DE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="badge-pill mb-3 inline-block font-bold">
              Transparent Factory Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
              Subscription Plans &amp; Usage-Based Credits
            </h2>
            <p className="text-base sm:text-lg text-[#52525B] leading-relaxed">
              100% of your subscription fee is credited into your export wallet. Use wallet tokens to export print-ready files at industrial wholesale rates.
            </p>

            {/* Matrix Tabs: Monthly | Quarterly | Instant QR */}
            <div className="inline-flex p-1.5 rounded-2xl bg-[#F5F3EF] border border-[#E8E4DE] mt-6 flex-wrap justify-center">
              <button
                onClick={() => setPricingTab('monthly')}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
                  pricingTab === 'monthly' ? 'bg-[#E4572E] text-white shadow-xs' : 'text-[#52525B] hover:text-[#171717]'
                )}
              >
                Monthly Plans (30 Days)
              </button>
              <button
                onClick={() => setPricingTab('quarterly')}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
                  pricingTab === 'quarterly' ? 'bg-[#E4572E] text-white shadow-xs' : 'text-[#52525B] hover:text-[#171717]'
                )}
              >
                Quarterly Plans (90 Days)
              </button>
              <button
                onClick={() => setPricingTab('spot')}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
                  pricingTab === 'spot' ? 'bg-[#E4572E] text-white shadow-xs' : 'text-[#52525B] hover:text-[#171717]'
                )}
              >
                Instant Payment (Pay Per Job QR)
              </button>
            </div>
          </div>

          {/* INSTANT PAYMENT (PAY AS YOU GO) TAB */}
          {pricingTab === 'spot' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#FAF9F6] rounded-3xl p-8 border-2 border-[#E4572E] shadow-soft text-center relative overflow-hidden">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E4572E] text-white text-xs font-bold uppercase tracking-wider mb-4">
                  <Zap size={14} /> Zero Monthly Commitment
                </div>
                <h3 className="text-3xl font-black text-[#171717] mb-2">Instant UPI Payment QR</h3>
                <p className="text-sm text-[#52525B] max-w-md mx-auto mb-6">
                  Process, grade and preview your jerseys in 2D and 3D completely free. Scan an instant Razorpay UPI QR code only when downloading your final print files.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6 text-left">
                  <div className="p-4 rounded-2xl bg-white border border-[#E8E4DE]">
                    <p className="text-xs text-[#71717A] font-semibold">With FiveNest Hem Tag</p>
                    <p className="text-3xl font-black text-[#E4572E] my-1">₹3.50<span className="text-xs text-[#71717A] font-normal"> /pc</span></p>
                    <p className="text-xs text-[#52525B]">Includes small discreet FiveNest hem tag</p>
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
                    <span>Front, sleeve and collar panels are ALWAYS 100% FREE</span>
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
                  Start Exporting with Instant QR
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
                    'relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-200',
                    plan.isPopular
                      ? 'bg-white border-2 border-[#E4572E] shadow-soft-lg ring-4 ring-[#E4572E]/10'
                      : 'bg-[#FAF9F6] border border-[#E8E4DE] hover:border-neutral-300'
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#E4572E] rounded-full text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
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
                        <span className="text-3xl font-black text-[#171717]">
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
                    <div className="p-3.5 rounded-2xl bg-white border border-[#E8E4DE] mb-4 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#52525B]">With Tag:</span>
                        <span className="font-bold text-[#E4572E]">
                          ₹{plan.rateWithTag.toFixed(2)}/pc (~{plan.jerseysWithTag} jerseys)
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#52525B]">Without Tag:</span>
                        <span className="font-bold text-[#171717]">
                          ₹{plan.rateWithoutTag.toFixed(2)}/pc (~{plan.jerseysWithoutTag} jerseys)
                        </span>
                      </div>
                    </div>

                    {/* Order Portal Badge */}
                    <div className="mb-4">
                      {plan.hasOrderPortalAccess ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                          <span>Includes Order Management Portal</span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-600 text-[11px] font-medium flex items-center gap-1.5">
                          <span>Studio Only (Order Portal optional)</span>
                        </div>
                      )}
                    </div>

                    {/* Feature bullet list */}
                    <ul className="space-y-2 mb-6 text-xs text-[#52525B]">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check size={14} className="text-[#E4572E] mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="#demo"
                    className={cn(
                      'w-full py-2.5 rounded-xl font-bold text-center text-xs transition-all block cursor-pointer',
                      plan.isPopular
                        ? 'bg-[#E4572E] hover:bg-[#D4431B] text-white shadow-brand'
                        : 'bg-white hover:bg-neutral-100 text-[#171717] border border-[#E8E4DE]'
                    )}
                  >
                    Choose {plan.name}
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* ── INTERACTIVE MONTHLY COST & SAVINGS ESTIMATOR ── */}
          <div className="mt-14 bg-[#FAF9F6] rounded-3xl p-6 sm:p-10 border border-[#E8E4DE] shadow-xs">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E4572E] bg-[#E4572E]/10 px-3 py-1 rounded-full border border-[#E4572E]/20">
                Interactive Cost Estimator
              </span>
              <h3 className="text-2xl font-black text-[#171717] mt-2 mb-2">
                Estimate Your Monthly Jersey Production Cost
              </h3>
              <p className="text-xs sm:text-sm text-[#52525B]">
                Adjust your expected monthly jersey volume to preview your usage costs and see which plan fits your production best.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-[#171717]">Expected Monthly Jerseys:</span>
                    <span className="text-2xl font-black text-[#E4572E] font-mono">
                      {calcMonthlyJerseys.toLocaleString()} Jerseys / month
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="5000"
                    step="50"
                    value={calcMonthlyJerseys}
                    onChange={(e) => setCalcMonthlyJerseys(Number(e.target.value))}
                    className="w-full h-3 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#E4572E]"
                  />
                  <div className="flex justify-between text-[11px] text-[#71717A] mt-1.5 font-mono">
                    <span>50 pcs</span>
                    <span>1,000 pcs</span>
                    <span>2,500 pcs</span>
                    <span>5,000+ pcs</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <span className="text-xs font-bold text-[#171717]">Tag Preference:</span>
                  <div className="inline-flex p-1 rounded-xl bg-white border border-[#E8E4DE]">
                    <button
                      onClick={() => setCalcWithTag(true)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        calcWithTag ? 'bg-[#E4572E] text-white shadow-xs' : 'text-[#52525B]'
                      )}
                    >
                      With FiveNest Hem Tag (₹3.50 base)
                    </button>
                    <button
                      onClick={() => setCalcWithTag(false)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        !calcWithTag ? 'bg-[#171717] text-white shadow-xs' : 'text-[#52525B]'
                      )}
                    >
                      Without Tag (₹5.50 standard)
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#E8E4DE] shadow-xs space-y-3.5">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#E8E4DE]">
                  <span className="font-bold text-[#171717] uppercase">ESTIMATED PRODUCTION SUMMARY</span>
                  <span className="text-xs text-[#E4572E] font-bold">Transparent Math</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#52525B]">Recommended Plan:</span>
                  <span className="font-bold text-[#171717]">{recommendedPlan?.name || 'Instant Payment'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#52525B]">Effective Per-Piece Rate:</span>
                  <span className="font-bold text-[#E4572E]">
                    ₹{calcWithTag ? (recommendedPlan?.rateWithTag || 3.50).toFixed(2) : (recommendedPlan?.rateWithoutTag || 5.50).toFixed(2)}/pc
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#52525B]">Front, Sleeve &amp; Collar Panels:</span>
                  <span className="font-bold text-emerald-700">100% Free (₹0.00)</span>
                </div>
                <div className="pt-2 border-t border-[#E8E4DE] flex justify-between items-baseline">
                  <span className="text-xs font-bold text-[#171717]">Estimated Usage Cost:</span>
                  <span className="text-2xl font-black text-[#171717]">₹{estimatedExportCost.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <p className="font-bold mb-0.5">Estimated Graphic Labor Saved: ~₹{estimatedMonthlySavings.toLocaleString()}/mo</p>
                  <p className="text-[11px] text-emerald-700">Saves ~{estimatedHoursSaved} manual Photoshop design hours every month.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2-STAGE ₹500 FREE TRIAL OFFER BANNER ── */}
          <div className="mt-14 max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-[#171717] via-[#242321] to-[#121212] p-8 sm:p-10 border border-white/10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#E4572E]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={14} /> New Factory Offer
                </div>
                <span className="text-xs text-neutral-400 font-mono">14 Days Validity • Zero Automatic Charges</span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
                Get up to ₹500 in Free Production Credits
              </h3>
              <p className="text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed mb-8">
                Available to eligible new sportswear manufacturing businesses after verification. Valid for 14 days from activation. One offer per business. No automatic card charges. Enough to complete several real team orders (~140 tagged jerseys).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-400">STAGE 1</span>
                    <span className="text-xs font-bold text-neutral-300">₹0</span>
                  </div>
                  <p className="font-bold text-white text-sm mb-1">Instant Studio Access</p>
                  <p className="text-xs text-neutral-400">Explore vector blueprints, test team rosters, and inspect 3D mockups freely.</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400">STAGE 2</span>
                    <span className="text-base font-extrabold text-emerald-400">+₹100</span>
                  </div>
                  <p className="font-bold text-white text-sm mb-1">Business Verification</p>
                  <p className="text-xs text-neutral-300">Verified mobile &amp; basic sportswear business details unlock your first credits.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#E4572E]/10 border border-[#E4572E]/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#FF7A50]">STAGE 3</span>
                    <span className="text-base font-extrabold text-[#FF7A50]">+₹400 Extra</span>
                  </div>
                  <p className="font-bold text-white text-sm mb-1">Live Onboarding Walkthrough</p>
                  <p className="text-xs text-neutral-300">A brief walkthrough call confirms genuine production and unlocks the full ₹500.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
                  <span>100% duplicate job refund guarantee: Query raised within 72h generates full wallet refund.</span>
                </div>
                <Link
                  to="/production"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#E4572E] to-[#EA580C] hover:opacity-95 text-white font-extrabold text-xs sm:text-sm text-center shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Claim Credits in Studio</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 7: CUSTOMER TRUST & PRODUCTION STANDARDS (VERIFIED TECHNICAL PROOF)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="trust" className="py-20 relative bg-[#F5F3EF] border-t border-[#E8E4DE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="badge-pill mb-3 inline-block font-bold">
              Engineering Standards
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight mb-3">
              Built to Stringent Sublimation Quality Standards
            </h2>
            <p className="text-sm sm:text-base text-[#52525B]">
              No inflated statistics. Here is the exact technical architecture that guarantees your print outputs run smoothly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E8E4DE] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#E4572E] flex items-center justify-center font-bold mb-4">
                <ShieldCheck size={22} />
              </div>
              <h4 className="text-lg font-bold text-[#171717] mb-2">300 DPI CMYK Lossless Standards</h4>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                Rendered using high-resolution 150–300 DPI canvas engines with calibrated CMYK profiles to ensure vibrant, bleed-free dye sublimation transfers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E8E4DE] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold mb-4">
                <Printer size={22} />
              </div>
              <h4 className="text-lg font-bold text-[#171717] mb-2">Universal RIP Software Compatibility</h4>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                Directly drag output files into Wasatch SoftRIP, Ergosoft, Onyx, PhotoPrint / Flexi, Mimaki RasterLink, and Epson Edge Print with zero file conversion.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#E8E4DE] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold mb-4">
                <Phone size={22} />
              </div>
              <h4 className="text-lg font-bold text-[#171717] mb-2">Direct Mumbai Factory Support</h4>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                Speak directly with our technical team in Mahim, Mumbai via WhatsApp or phone. Operating Monday to Saturday from 9:00 AM to 8:00 PM IST.
              </p>
            </div>
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 8: LIVE DEMO CONVERSION SECTION ("SEE HOW FIVENEST FITS YOUR WORKFLOW")
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="demo" className="py-24 relative bg-white border-t border-[#E8E4DE]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="bg-[#FAF9F6] rounded-3xl p-8 sm:p-12 border border-[#E8E4DE] shadow-soft-lg">
            
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E4572E]/10 text-[#E4572E] text-xs font-bold uppercase mb-3">
                <Calendar size={14} /> Personalized Walkthrough
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight mb-3">
                See How FiveNest Fits Your Production Workflow
              </h2>
              <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                Book a personalized live demonstration with our team. We can test with your own tournament squad roster and garment artwork so you can inspect the output firsthand.
              </p>
            </div>

            {/* FORM COMPONENT */}
            {!formSubmitted ? (
              <form onSubmit={handleDemoSubmit} className="space-y-4 max-w-xl mx-auto">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={nameInputId} className="block text-xs font-bold text-[#171717] mb-1.5">
                      Your Name or Business Name *
                    </label>
                    <input
                      id={nameInputId}
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma / Apex Sports"
                      value={demoForm.name}
                      onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E4DE] text-sm text-[#171717] focus:outline-none focus:border-[#E4572E] focus:ring-1 focus:ring-[#E4572E]"
                    />
                  </div>

                  <div>
                    <label htmlFor={phoneInputId} className="block text-xs font-bold text-[#171717] mb-1.5">
                      WhatsApp / Mobile Number *
                    </label>
                    <input
                      id={phoneInputId}
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={demoForm.phone}
                      onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E4DE] text-sm text-[#171717] focus:outline-none focus:border-[#E4572E] focus:ring-1 focus:ring-[#E4572E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={businessTypeSelectId} className="block text-xs font-bold text-[#171717] mb-1.5">
                      Business Type
                    </label>
                    <select
                      id={businessTypeSelectId}
                      value={demoForm.businessType}
                      onChange={(e) => setDemoForm({ ...demoForm, businessType: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E4DE] text-sm text-[#171717] focus:outline-none focus:border-[#E4572E]"
                    >
                      <option value="Manufacturer">Sportswear Manufacturer</option>
                      <option value="Sportswear Designer">Sportswear Designer</option>
                      <option value="Sublimation Print Shop">Sublimation Printing Unit</option>
                      <option value="Uniform Retailer">Uniform Retailer / Brand</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor={monthlyVolumeSelectId} className="block text-xs font-bold text-[#171717] mb-1.5">
                      Expected Monthly Volume
                    </label>
                    <select
                      id={monthlyVolumeSelectId}
                      value={demoForm.monthlyVolume}
                      onChange={(e) => setDemoForm({ ...demoForm, monthlyVolume: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8E4DE] text-sm text-[#171717] focus:outline-none focus:border-[#E4572E]"
                    >
                      <option value="Under 200 Jerseys">Under 200 Jerseys / month</option>
                      <option value="200 - 1,000 Jerseys">200 – 1,000 Jerseys / month</option>
                      <option value="1,000 - 5,000 Jerseys">1,000 – 5,000 Jerseys / month</option>
                      <option value="5,000+ Jerseys">5,000+ Jerseys / month</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor={notesTextareaId} className="block text-xs font-bold text-[#171717] mb-1.5">
                    Specific Requirements or Questions (Optional)
                  </label>
                  <textarea
                    id={notesTextareaId}
                    rows={2}
                    placeholder="e.g. We want to test vector sizing on our cricket tournament roster..."
                    value={demoForm.notes}
                    onChange={(e) => setDemoForm({ ...demoForm, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8E4DE] text-sm text-[#171717] focus:outline-none focus:border-[#E4572E]"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="btn-primary w-full sm:flex-1 py-3.5 text-sm font-bold shadow-brand flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {formSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Scheduling Demo...</span>
                      </>
                    ) : (
                      <>
                        <Calendar size={16} />
                        <span>Schedule Live Walkthrough</span>
                      </>
                    )}
                  </button>

                  <a
                    href={getWhatsAppDemoUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-emerald-600/10 border border-emerald-600/25 text-emerald-800 text-xs font-bold hover:bg-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} className="text-emerald-700" />
                    <span>Instant WhatsApp Booking</span>
                  </a>
                </div>

                <p className="text-[11px] text-[#71717A] text-center pt-2">
                  🔒 We respect your privacy. No spam. Your phone number is used exclusively for demo scheduling.
                </p>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-black text-[#171717]">Demo Request Received!</h3>
                <p className="text-sm text-[#52525B]">
                  Thank you, <strong>{demoForm.name}</strong>. Our technical team based in Mumbai will reach out to you at <strong>{demoForm.phone}</strong> via WhatsApp within 1 business hour.
                </p>
                <div className="pt-3 flex justify-center gap-3">
                  <a
                    href={getWhatsAppDemoUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary px-6 py-3 text-xs sm:text-sm font-bold shadow-brand flex items-center gap-2"
                  >
                    <MessageSquare size={16} />
                    <span>Connect Immediately on WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 9: FREQUENTLY ASKED QUESTIONS (FAQ — 10 TARGETED BUYER OBJECTIONS)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 relative bg-[#F5F3EF] border-t border-[#E8E4DE]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center mb-14">
            <span className="badge-pill mb-3 inline-block font-bold">
              Buyer Questions Answered
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-[#52525B]">
              Real, verified answers about software compatibility, export formats, subscriptions, and production capabilities.
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              {
                q: 'What exactly does FiveNest do?',
                a: 'FiveNest is a complete web-based sportswear production and order management platform. It automates jersey vector scaling across junior to 5XL sizes, auto-places team names and numbers from Excel rosters, generates high-res print-ready individual panels with 10mm seam bleeds, and manages wholesale customer orders, factory job sheets, and GST invoicing.',
              },
              {
                q: 'Who is FiveNest built for?',
                a: 'FiveNest is built specifically for Indian sportswear manufacturers, sublimation printing units, athletic apparel brands, and jersey graphic designers. Whether you operate a 2-printer shop or a large manufacturing facility with multiple wide-format plotters, FiveNest scales to your volume.',
              },
              {
                q: 'Is FiveNest suitable for small jersey manufacturing units?',
                a: 'Yes, absolutely. With our Instant Payment (Pay As You Go QR) option, small shops have zero monthly commitment—you can grade, preview in 3D, and only pay ₹3.50 per jersey when you export files. For growing units, our Starter plan begins at just ₹1,000/month, and 100% of that amount is credited into your export wallet.',
              },
              {
                q: 'How does team roster name, number, and size automation work?',
                a: 'You simply paste or upload your tournament player list from Excel or CSV. FiveNest automatically generates vector-sharp names and numbers, applies proper arching and outlines, and proportions artwork precisely across every garment size from junior 18 up to 60 (5XL), eliminating manual Photoshop typing mistakes.',
              },
              {
                q: 'Can I preview designs in 2D and 3D before printing?',
                a: 'Yes. You can inspect exact 2D multi-panel layouts (Front chest, full back, sleeves, collar ribbing) with millimetre bleed lines, as well as an interactive 3D WebGL jersey proof that you can rotate 360° to review seam alignments before printing.',
              },
              {
                q: 'How does production file exporting work, and which RIP software is supported?',
                a: 'FiveNest exports clean, uncompressed 300 DPI CMYK TIFF or PDF files organized neatly into size-specific folders (e.g. Size_L, Size_XL). Every panel is labeled explicitly with player name, size, and Left/Right sleeve indicators. Output files can be dragged directly into Wasatch SoftRIP, NeoStampa, PhotoPrint / Flexi, Mimaki RasterLink, Epson Edge Print, or Caldera.',
              },
              {
                q: 'Can I manage customer orders, cutting job sheets, and GST billing?',
                a: 'Yes. The Order Management Portal (included with plans or wallet balances of ₹5,000 and above) lets wholesale customers input squad lists directly, generates printable cutting job sheets with fabric yardage for floor staff, and creates GST-compliant tax invoices with Razorpay payment links.',
              },
              {
                q: 'How do subscription plans, export credits, and wallet tokens work?',
                a: 'When you purchase a subscription (e.g., ₹2,500 or ₹5,000), 100% of that amount is deposited into your FiveNest export wallet. Each time you export a print-ready jersey, wallet tokens are deducted at your discounted rate (e.g., ₹2.50/pc). Front, sleeve, and collar panels are ALWAYS 100% free; only the variable player back panel is charged.',
              },
              {
                q: 'Does FiveNest require Photoshop, Illustrator, or CorelDraw?',
                a: 'No installation is required. FiveNest is a 100% web-based SaaS application that runs smoothly inside any modern web browser (Google Chrome, Microsoft Edge, Safari, Firefox) on PC, Mac, or tablet. You can upload artwork designed in Illustrator, Photoshop, or CorelDraw, and FiveNest handles all subsequent sizing, grading, and exporting automatically.',
              },
              {
                q: 'How do I book a live demonstration or test with my own files?',
                a: 'You can schedule a walkthrough using the live booking form above, or click the WhatsApp button to message our team directly at +91 88792 28710. We will set up a live screen-share demonstration using your own actual jersey artwork and team roster so you can evaluate the output firsthand.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#E8E4DE] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-[#171717] flex justify-between items-center gap-4 cursor-pointer"
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
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#52525B] leading-relaxed border-t border-[#F5F3EF]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 10: REAL-TIME PRODUCTION OUTPUT MONITOR (LIVE ENGINE TRACKER)
      ───────────────────────────────────────────────────────────────────────────── */}
      <LiveExportCounter />

      {/* Global Clean Footer */}
      <Footer />

      {/* Mobile Sticky Demo Booking Bar (Non-Obtrusive) */}
      <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40 bg-white/95 backdrop-blur-md border border-[#E8E4DE] p-2 rounded-2xl shadow-lg flex items-center justify-between gap-2">
        <div className="pl-2">
          <p className="text-xs font-black text-[#171717]">Book Live Walkthrough</p>
          <p className="text-[10px] text-[#71717A]">Free 1-on-1 team demo</p>
        </div>
        <a
          href="#demo"
          className="px-4 py-2 bg-[#E4572E] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
        >
          <Calendar size={13} />
          <span>Book Demo</span>
        </a>
      </div>

    </div>
  );
}
