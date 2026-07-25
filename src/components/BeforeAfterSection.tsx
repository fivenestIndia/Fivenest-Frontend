import { motion } from "framer-motion";
import { XCircle, CheckCircle2, ArrowRight, Zap, Clock, AlertTriangle, Sparkles, Check, X } from "lucide-react";
import { Link } from "react-router-dom";

const metricsData = [
  {
    feature: "Production Time",
    manual: "4 Hours Per Batch",
    fivenest: "3 Minutes Total",
    highlight: true,
  },
  {
    feature: "User Clicks",
    manual: "400+ Manual Clicks",
    fivenest: "1 Single Click",
    highlight: true,
  },
  {
    feature: "Operators Needed",
    manual: "2 Full-Time Staff",
    fivenest: "1 Operator (Part-Time)",
    highlight: false,
  },
  {
    feature: "Typo & Size Misprints",
    manual: "8-10 Mistakes / Batch",
    fivenest: "0 Mistakes (100% Accuracy)",
    highlight: true,
  },
  {
    feature: "Software Cost Model",
    manual: "Expensive Fixed Subscriptions",
    fivenest: "Pay Only When You Generate",
    highlight: false,
  },
];

const manualSteps = [
  "Receive Roster PDF / WhatsApp Image",
  "Manually re-type names into Excel",
  "Open local desktop software & master files",
  "Duplicate layers for each size (S, M, L, XL, XXL)",
  "Manually resize jersey panels in inches",
  "Replace Player Name text layer",
  "Replace Player Number text layer",
  "Align left & right chest sponsor logos",
  "Export JPEG files one-by-one",
  "Repeat 35 tedious manual steps per jersey...",
];

const fivenestSteps = [
  "Import CSV or Paste Roster Image",
  "Click Auto-Nest & Grade Sizes",
  "Direct 300 DPI Plotter Export",
];

const BeforeAfterSection = () => {
  return (
    <section className="py-24 md:py-36 relative overflow-hidden bg-slate-950/60 border-y border-slate-800/80">
      {/* Glow Orbs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10">
            ⚡ Direct Value Comparison
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Stop Wasting 4 Hours Daily on <br />
            <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
              Manual Artwork Preparation
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Compare manual preparation against FiveNest Web Studio cloud automation side-by-side.
          </p>
        </motion.div>

        {/* Direct Metric Comparison Table */}
        <div className="max-w-4xl mx-auto mb-16 rounded-3xl bg-slate-900/80 border border-slate-800 p-4 md:p-8 backdrop-blur-xl shadow-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[540px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4">Production Metric</th>
                <th className="py-4 px-4 text-rose-400 flex items-center gap-1.5"><XCircle size={16} /> Manual Process</th>
                <th className="py-4 px-4 text-cyan-400 flex items-center gap-1.5"><CheckCircle2 size={16} /> FiveNest Web Studio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs md:text-sm font-semibold">
              {metricsData.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-4 px-4 text-white font-bold">{m.feature}</td>
                  <td className="py-4 px-4 text-rose-300 bg-rose-500/5 font-mono">{m.manual}</td>
                  <td className="py-4 px-4 text-cyan-300 bg-cyan-500/10 font-bold font-mono">{m.fivenest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 35 Steps vs 3 Steps Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {/* BEFORE: MANUAL */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-6 md:p-8 bg-slate-900/40 border border-rose-500/20 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-rose-500/20 text-rose-400 border-b border-l border-rose-500/30 rounded-bl-2xl text-xs font-extrabold flex items-center gap-1.5">
              <AlertTriangle size={14} />
              MANUAL WORKFLOW
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <XCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Manual Production Pain</h3>
                  <p className="text-xs text-rose-400 font-semibold">35 Steps · 4 Hours Per Order · 10 Mistakes</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {manualSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs md:text-sm text-slate-300">
                    <span className="font-mono text-rose-400 font-bold min-w-[20px]">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center justify-between">
              <span>Total Time: ~4 Hours</span>
              <span>Error Rate: ~8% Misprints</span>
            </div>
          </motion.div>

          {/* AFTER: FIVENEST */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border-2 border-cyan-500/50 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-cyan-400 to-emerald-400 text-black border-b border-l border-cyan-500/30 rounded-bl-2xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20">
              <Sparkles size={14} />
              FIVENEST WEB STUDIO
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Automated Production Line</h3>
                  <p className="text-xs text-cyan-300 font-semibold">3 Steps · 3 Minutes Total · 0 Mistakes</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {fivenestSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-sm md:text-base text-white font-bold shadow-lg shadow-cyan-500/5">
                    <span className="w-8 h-8 rounded-xl bg-cyan-400 text-black font-black flex items-center justify-center text-sm flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-bold flex items-center justify-between mb-8">
                <span className="flex items-center gap-1.5"><Clock size={16} /> Total Time: 3 Minutes</span>
                <span className="flex items-center gap-1.5"><Zap size={16} /> 0 Human Mistakes</span>
              </div>
            </div>

            <Link to="/studio">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 cursor-pointer"
              >
                Create Free Factory Account Now
                <ArrowRight size={18} />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterSection;
