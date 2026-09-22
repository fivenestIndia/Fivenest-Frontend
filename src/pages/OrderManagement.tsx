import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, FileText, Users, BarChart3, Wallet, Shield, CheckCircle,
  ArrowRight, Clock, ChevronDown, ChevronRight, 
  Download, Filter, Search, TrendingUp, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const cn = (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ');

// ─── Feature Detail ──────────────────────────────────────────────────────────
interface FeatureDetail {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  points: string[];
  visual: React.ReactNode;
}

// ─── Mini Dashboard Visual (Light Clean SaaS) ─────────────────────────────────
function OrderDashboardVisual() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#E2DED7] bg-white shadow-soft-lg">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8E4DE] bg-[#FAF8F5]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-[#71717A] text-xs font-semibold">Orders Control Center</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Auto Sync
        </span>
      </div>
      <div className="p-5 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8984]" />
            <input
              readOnly
              value="Mumbai Royals"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F5F3EF] border border-[#E2DED7] text-xs font-medium text-[#171717]"
            />
          </div>
          <button className="p-2 rounded-xl bg-[#F5F3EF] border border-[#E2DED7] text-[#52525B]">
            <Filter size={14} />
          </button>
        </div>

        {[
          { id: '#FN-001', team: 'Mumbai Royals FC', qty: 22, amount: '₹14,300', status: 'Paid in Full', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { id: '#FN-002', team: 'Delhi Stars CC', qty: 16, amount: '₹10,400', status: 'Invoice Sent', color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { id: '#FN-003', team: 'Chennai Kings Hockey', qty: 30, amount: '₹19,500', status: 'In Production', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        ].map((o) => (
          <div key={o.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E4DE] hover:border-[#E4572E]/40 transition-colors">
            <div>
              <p className="text-[#171717] text-xs font-bold">{o.team}</p>
              <p className="text-[#71717A] text-[11px] font-medium mt-0.5">{o.id} · {o.qty} jerseys</p>
            </div>
            <div className="text-right">
              <p className="text-[#171717] text-xs font-black">{o.amount}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${o.color}`}>
                {o.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceVisual() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#E2DED7] bg-white p-6 shadow-soft-lg">
      <div className="flex justify-between items-start mb-5 pb-4 border-b border-[#E8E4DE]">
        <div>
          <div className="flex items-center gap-1">
            <span className="text-[#171717] font-black text-sm">Fivenest</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E4572E]" />
          </div>
          <p className="text-[#71717A] text-[11px] font-semibold mt-0.5">GST Tax Invoice (Compliant)</p>
        </div>
        <div className="text-right">
          <p className="text-[#171717] font-bold text-xs">#INV-2024-089</p>
          <p className="text-[#71717A] text-[11px]">Due on receipt</p>
        </div>
      </div>

      <div className="space-y-2.5 mb-5">
        {[
          { item: 'Sublimation Jersey Printing (22 units)', qty: 22, price: '₹650', total: '₹14,300' },
          { item: 'Name/Number Vector Generation', qty: 22, price: '₹4', total: '₹88' },
          { item: 'GST (12% Textile SGST + CGST)', qty: 1, price: '—', total: '₹1,726' },
        ].map((r) => (
          <div key={r.item} className="flex justify-between text-xs py-1 border-b border-[#F0ECE6]">
            <span className="text-[#52525B] font-medium flex-1">{r.item}</span>
            <span className="text-[#71717A] w-8 text-center">{r.qty}</span>
            <span className="text-[#171717] w-16 text-right font-bold">{r.total}</span>
          </div>
        ))}
      </div>

      <div className="pt-2 flex justify-between items-center mb-5">
        <span className="text-[#171717] font-bold text-sm">Grand Total</span>
        <span className="text-[#E4572E] font-black text-lg">₹16,114</span>
      </div>

      <div className="flex gap-2.5">
        <button className="flex-1 py-2.5 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B] transition-colors flex items-center justify-center gap-1.5">
          <Download size={13} /> Download PDF
        </button>
        <button className="flex-1 py-2.5 rounded-xl bg-[#F5F3EF] border border-[#E2DED7] text-[#171717] text-xs font-bold hover:bg-[#EFECE6] transition-colors">
          Share to Client Portal
        </button>
      </div>
    </div>
  );
}

function ClientPortalVisual() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#E2DED7] bg-white shadow-soft-lg">
      <div className="bg-[#FAF8F5] border-b border-[#E8E4DE] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#E4572E] uppercase tracking-wider">Client View</p>
            <p className="text-base font-extrabold text-[#171717]">Apex Sports Academy</p>
          </div>
          <span className="text-xs font-bold bg-white px-3 py-1 rounded-full border border-[#E2DED7] text-[#171717]">
            Active Client
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E8E4DE] text-center">
            <p className="text-2xl font-black text-[#E4572E]">8</p>
            <p className="text-[11px] font-bold text-[#71717A] uppercase mt-0.5">Active Batches</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F5F3EF] border border-[#E8E4DE] text-center">
            <p className="text-2xl font-black text-[#171717]">₹74K</p>
            <p className="text-[11px] font-bold text-[#71717A] uppercase mt-0.5">Billed Total</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-amber-800">Production Token Wallet</p>
              <p className="text-lg font-black text-amber-900">₹1,850 Balance</p>
            </div>
            <Wallet size={24} className="text-amber-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

function WalletVisual() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[#E2DED7] bg-white p-6 shadow-soft-lg">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#E8E4DE]">
        <div>
          <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Token Balance</p>
          <p className="text-3xl font-black text-[#171717]">₹2,450</p>
          <p className="text-xs font-bold text-emerald-700 mt-0.5">+₹500 added this billing cycle</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#E4572E]/10 border border-[#E4572E]/20 flex items-center justify-center text-[#E4572E]">
          <Wallet size={24} />
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2">Recent File Deductions</p>
        {[
          { action: 'Batch: Mumbai Royals (22 jerseys)', cost: '-₹88', time: '2 hours ago' },
          { action: 'Monthly Subscription Credit', cost: '+₹500', time: '3 days ago' },
          { action: 'Batch: Delhi Stars (16 jerseys)', cost: '-₹64', time: '4 days ago' },
        ].map((t) => (
          <div key={t.action} className="flex justify-between items-center p-2.5 rounded-xl bg-[#F5F3EF] border border-[#E8E4DE] text-xs">
            <div>
              <p className="font-bold text-[#171717]">{t.action}</p>
              <p className="text-[10px] text-[#71717A]">{t.time}</p>
            </div>
            <span className={`font-extrabold ${t.cost.startsWith('+') ? 'text-emerald-700' : 'text-[#E4572E]'}`}>
              {t.cost}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Accordion FAQ ───────────────────────────────────────────────────────────
function FAQ({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#E8E4DE] rounded-xl overflow-hidden bg-white shadow-soft transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#FAF8F5] transition-colors"
      >
        <span className="text-[#171717] font-bold text-base">{question}</span>
        <ChevronDown
          size={18}
          className={`text-[#71717A] transition-transform duration-300 flex-shrink-0 ml-4 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-[#52525B] text-sm leading-relaxed border-t border-[#E8E4DE] pt-4">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Features Configuration ──────────────────────────────────────────────────
const features: FeatureDetail[] = [
  {
    id: 'orders',
    icon: <Package size={22} />,
    title: 'Smart Order Creation & Tracking',
    description: 'Create and track manufacturing orders with complete player details, sizes, quantities, and design artwork.',
    points: ['Bulk roster upload via CSV or direct entry', 'Per-player name, number, and size specs', 'Real-time order stage workflow automation', 'Design proofing and version control'],
    visual: <OrderDashboardVisual />,
  },
  {
    id: 'billing',
    icon: <FileText size={22} />,
    title: 'Automated GST Billing & Invoicing',
    description: 'Generate GST-compliant tax invoices automatically for every order without manual spreadsheet calculations.',
    points: ['GST-ready PDF invoices generated instantly', 'Automated SGST/CGST tax calculations', 'Payment status tracking & invoice history', 'Direct client portal dispatch'],
    visual: <InvoiceVisual />,
  },
  {
    id: 'portal',
    icon: <Users size={22} />,
    title: 'Dedicated Client Portal',
    description: 'Each client gets their own branded portal to place orders, verify rosters, and download invoices.',
    points: ['Subscription-gated secure login', 'Live order status updates to reduce calls', 'Self-service invoice download center', 'Eliminates WhatsApp message confusion'],
    visual: <ClientPortalVisual />,
  },
  {
    id: 'wallet',
    icon: <Wallet size={22} />,
    title: 'Token Wallet Integration',
    description: 'Subscription includes wallet tokens that power automated Production Studio file generations.',
    points: ['Monthly automatic token balance allocation', 'Pay-per-use file generation rate (~₹4/jersey)', 'Top-up wallet balance anytime in seconds', 'Complete transparency with deduction logs'],
    visual: <WalletVisual />,
  },
];

export default function OrderManagement() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="relative bg-[#F5F3EF]">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute inset-0 hero-radial pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <span className="badge-pill mb-6 inline-flex items-center gap-2">
                <Package size={13} />
                Order Management System
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-hero mb-6"
            >
              Manufacturing billing &amp;<br />
              <span className="text-[#E4572E]">order chaos — eliminated</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-section-subtitle mb-8"
            >
              From squad roster submission to automated GST invoices. Your clients get a dedicated self-service portal, while you get an organized production queue.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/contact"
                className="btn-primary"
              >
                Start Free Trial <ArrowRight size={16} />
              </Link>
              <Link
                to="/production"
                className="btn-secondary"
              >
                Explore Production Studio <ChevronRight size={16} />
              </Link>
            </motion.div>
          </div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-10 border-t border-[#E8E4DE]"
          >
            {[
              { icon: <Clock size={18} />, value: '< 2 min', label: 'Invoice Generation Time' },
              { icon: <TrendingUp size={18} />, value: '100%', label: 'GST Compliant' },
              { icon: <Users size={18} />, value: 'Unlimited', label: 'Client Portals Included' },
              { icon: <CheckCircle size={18} />, value: '0', label: 'Manual Order Errors' },
            ].map((s) => (
              <div key={s.label} className="card-clean p-5">
                <div className="text-[#E4572E] mb-2">{s.icon}</div>
                <p className="text-2xl font-black text-[#171717]">{s.value}</p>
                <p className="text-[#71717A] text-xs font-semibold uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── INTERACTIVE FEATURES ──────────────────────────────────── */}
      <section className="py-24 relative bg-[#EFECE6]/40 border-y border-[#E8E4DE]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge-pill mb-4 inline-block">Core Capabilities</span>
            <h2 className="text-section-title mb-4">
              Everything built for high-volume <span className="text-[#E4572E]">apparel printers</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Feature Selector */}
            <div className="space-y-3">
              {features.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFeature(i)}
                  className={cn(
                    'w-full text-left p-5 rounded-2xl border transition-all duration-200 text-left',
                    activeFeature === i
                      ? 'border-[#E4572E] bg-white shadow-soft ring-2 ring-[#E4572E]/10'
                      : 'border-[#E8E4DE] bg-white/60 hover:bg-white hover:border-[#D8D5CF]'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                      activeFeature === i ? 'bg-[#E4572E] text-white' : 'bg-[#F5F3EF] text-[#71717A]'
                    )}>
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#171717] mb-1">
                        {f.title}
                      </h3>
                      <p className="text-[#52525B] text-sm leading-relaxed">{f.description}</p>
                    </div>
                  </div>

                  {activeFeature === i && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 ml-15 pl-15 space-y-2 border-t border-[#E8E4DE] pt-3.5"
                    >
                      {f.points.map((p) => (
                        <li key={p} className="flex items-center gap-2.5 text-xs font-medium text-[#52525B]">
                          <CheckCircle size={14} className="text-[#E4572E] flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </button>
              ))}
            </div>

            {/* Right: Live Interactive Visual Mockup */}
            <div className="lg:sticky lg:top-28">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  {features[activeFeature].visual}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── BEFORE VS AFTER ────────────────────────────────────────── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="badge-pill mb-4 inline-block">Workflow Comparison</span>
            <h2 className="text-section-title">Before vs. After Fivenest</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Without Fivenest */}
            <div className="p-8 rounded-2xl border border-rose-200 bg-rose-50/50 shadow-soft">
              <h3 className="text-rose-700 font-extrabold text-lg mb-4 flex items-center gap-2">
                <span>❌</span> Without Fivenest (Manual)
              </h3>
              <ul className="space-y-3">
                {[
                  'Orders scattered across WhatsApp chats & voice notes',
                  'Manual invoice creation in Excel taking 30+ minutes',
                  'Constant customer calls demanding order status updates',
                  'Incorrect player sizes resulting in wasted print fabric',
                  'No clear visibility on the shop production queue',
                  'Designers spending hours on administration instead of printing',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-700">
                    <span className="text-rose-500 font-bold text-base leading-none">×</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* With Fivenest */}
            <div className="p-8 rounded-2xl border-2 border-[#E4572E] bg-white shadow-soft-lg">
              <h3 className="text-[#E4572E] font-extrabold text-lg mb-4 flex items-center gap-2">
                <span>✅</span> With Fivenest (Automated)
              </h3>
              <ul className="space-y-3">
                {[
                  'All squad orders structured inside one clean dashboard',
                  'GST-ready invoices generated and sent in seconds',
                  'Self-service client portal handles all status tracking',
                  'Rosters validated with zero typo or sizing mistakes',
                  'Live real-time visibility on production progress',
                  '100% focus on quality printing and fast dispatch',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#171717] font-medium">
                    <CheckCircle size={16} className="text-[#E4572E] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#EFECE6]/40 border-t border-[#E8E4DE]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-pill mb-4 inline-block">Questions Answered</span>
            <h2 className="text-section-title mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            <FAQ
              question="How does client portal access work?"
              answer="Each of your clients receives a secure portal link. They can submit team sizes and numbers, check live production status, and download tax invoices without messaging you on WhatsApp."
            />
            <FAQ
              question="Is the billing system fully GST compliant?"
              answer="Yes, all invoices generated by Fivenest are formatted for GST compliance in India with proper GSTIN fields, HSN codes, and automatic tax breakdowns."
            />
            <FAQ
              question="Can I manage multiple clients under one subscription?"
              answer="Yes! All plans support unlimited customer portals. You can onboard dozens of sports academies, corporate clients, or tournament organizers at no extra fee."
            />
            <FAQ
              question="How are tokens deducted for order processing?"
              answer="Creating orders and generating invoices is completely free and unlimited. Tokens are only deducted when you use Production Studio to generate the high-resolution vector print files."
            />
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 relative bg-[#171717] text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">
            Ready to organize your <span className="text-[#E4572E]">order pipeline?</span>
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Say goodbye to spreadsheets and WhatsApp confusion. Start with our automated order management system today.
          </p>
          <Link
            to="/contact"
            className="btn-primary py-4 px-8 text-base shadow-brand-lg"
          >
            Start Free Trial <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
