import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Check, X, ShieldCheck, ArrowRight, Sparkles, Zap, RefreshCw, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const walletPillars = [
  {
    title: "No Monthly Subscriptions",
    desc: "Never pay fixed monthly fees. If you don't print jerseys this week, you pay ₹0.",
    icon: X,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  {
    title: "Pay Only Per Panel Generated",
    desc: "₹3/pc with FiveNest Watermark Logo, or ₹5/pc without. Pay only for completed 300 DPI exports.",
    icon: Zap,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    title: "Recharge Anytime via Razorpay",
    desc: "Instant wallet top-ups via GPay, PhonePe, UPI, NetBanking, or Credit/Debit cards.",
    icon: CreditCard,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Automatic Instant Refunds",
    desc: "If file generation is cancelled or fails, your wallet credits are automatically refunded in full.",
    icon: RefreshCw,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
];

const WalletProductionSection = () => {
  return (
    <section id="pricing" className="py-24 md:py-36 relative overflow-hidden bg-slate-950">
      {/* Glow Orbs */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 max-w-fit mx-auto">
            <Wallet size={14} />
            Pay-As-You-Go Wallet Model
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Pay Only When You Generate. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              No Subscriptions. No Contracts.
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Recharge your wallet anytime. Generate 300 DPI production files only when orders come in.
          </p>
        </motion.div>

        {/* 4 Wallet Value Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {walletPillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -6 }}
                key={p.title}
                className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-6 ${p.color}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Clear What You Pay For vs What You Don't Transparency Box */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-10 backdrop-blur-xl shadow-2xl">
          <h3 className="text-xl md:text-2xl font-black text-white mb-8 text-center flex items-center justify-center gap-2">
            <ShieldCheck size={24} className="text-cyan-400" />
            100% Billing Transparency Guarantee
          </h3>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* You are charged ONLY for */}
            <div className="p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4 flex items-center gap-2">
                <Check size={16} className="text-cyan-400" />
                You ARE Charged Only When:
              </div>
              <ul className="space-y-3 text-xs md:text-sm font-semibold text-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>Print-ready 300 DPI files are successfully generated</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>₹3 / pc</strong> when FiveNest 180° Watermark Logo is ON</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>₹5 / pc</strong> when FiveNest 180° Watermark Logo is OFF</span>
                </li>
              </ul>
            </div>

            {/* You are NOT charged for */}
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
                <X size={16} className="text-emerald-400" />
                You Are NOT Charged For:
              </div>
              <ul className="space-y-3 text-xs md:text-sm font-semibold text-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✕</span>
                  <span>Uploading Excel / CSV roster files (100% Free)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✕</span>
                  <span>Viewing 3D Jersey Preview & artwork setups</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✕</span>
                  <span>Editing text overlays or custom size tables</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✕</span>
                  <span>Cancelled or failed generations (Instant Refund)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/studio">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-extrabold text-base shadow-xl shadow-cyan-500/25 inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={18} />
                Create Free Factory Account — Start with Free Test Mode
                <ArrowRight size={18} />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WalletProductionSection;
