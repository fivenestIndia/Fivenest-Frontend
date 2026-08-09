import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Play, Wallet, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden bg-slate-950">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Category Positioning Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs md:text-sm font-bold uppercase tracking-wider mb-8 shadow-lg shadow-cyan-500/10"
          >
            <Sparkles size={16} className="text-cyan-400" />
            <span>Cloud Production Platform for Sportswear Manufacturers</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08] mb-6"
          >
            Generate Print-Ready Jerseys in Minutes — <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Pay Only for What You Generate.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Import one Excel file. FiveNest automatically sizes, nests, renames, and exports 300 DPI print files for your sublimation printer. <strong className="text-white font-bold">No software installation required.</strong>
          </motion.p>

          {/* High-Converting CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link to="/studio" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto px-8 py-4.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-extrabold text-base md:text-lg flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/25 cursor-pointer"
              >
                <span>Create Free Factory Account</span>
                <ArrowRight size={20} />
              </motion.button>
            </Link>

            <Link to="/studio" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto px-8 py-4.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-700 font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShieldCheck size={18} className="text-cyan-400" />
                <span>Start Free — No Credit Card Required</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Quick Value Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 md:p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl max-w-4xl mx-auto shadow-2xl"
          >
            <div className="text-center p-3 border-r border-slate-800/60 last:border-none">
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Few Seconds
              </div>
              <div className="text-xs text-slate-400 font-semibold mt-1">Web Production Studio Speed</div>
            </div>

            <div className="text-center p-3 border-r border-slate-800/60 last:border-none">
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                ₹3 - ₹5 / pc
              </div>
              <div className="text-xs text-slate-400 font-semibold mt-1">Web Wallet / Spot Payment</div>
            </div>

            <div className="text-center p-3 border-r border-slate-800/60 last:border-none">
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                5 - 10 Mins
              </div>
              <div className="text-xs text-slate-400 font-semibold mt-1">Photoshop Plugin Batch</div>
            </div>

            <div className="text-center p-3">
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Multi-Team
              </div>
              <div className="text-xs text-slate-400 font-semibold mt-1">Enterprise Auto Billing</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
