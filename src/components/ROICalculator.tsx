import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Clock, IndianRupee, Zap, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ROICalculator = () => {
  const [jerseysPerMonth, setJerseysPerMonth] = useState(250);
  const [useWatermark, setUseWatermark] = useState(true);

  const stats = useMemo(() => {
    // Manual: ~1.5 mins per jersey panel set. FiveNest: ~0.05 mins (3 secs).
    const manualHours = Math.round((jerseysPerMonth * 1.5 * 4) / 60); // 4 panels per kit
    const fivenestMins = Math.round((jerseysPerMonth * 0.05 * 4));
    
    // Wallet cost: ₹3/pc with watermark, ₹5/pc without. Average 4 panels per jersey kit.
    const ratePerPanel = useWatermark ? 3 : 5;
    const walletCost = jerseysPerMonth * 4 * ratePerPanel;
    
    // Operator cost saved @ ₹150/hr
    const operatorSavedCost = manualHours * 150;
    const netMoneySaved = Math.max(operatorSavedCost - walletCost, 0);

    return {
      manualHours,
      fivenestMins,
      walletCost,
      netMoneySaved,
    };
  }, [jerseysPerMonth, useWatermark]);

  return (
    <section id="roi" className="py-24 md:py-36 relative overflow-hidden bg-slate-950">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
            <Calculator size={14} />
            <span>Interactive Factory Cost Calculator</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Calculate Your Factory's <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Exact Monthly Savings</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Drag the slider to match your monthly jersey order volume and see your wallet cost & time saved.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-6 md:p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                How Many Jerseys Do You Print Monthly?
              </h3>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <label className="text-sm font-semibold text-slate-300">Monthly Jersey Volume</label>
                    <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {jerseysPerMonth.toLocaleString("en-IN")} <span className="text-sm text-slate-400 font-medium">jerseys</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={5000}
                    step={50}
                    value={jerseysPerMonth}
                    onChange={(e) => setJerseysPerMonth(Number(e.target.value))}
                    className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-400 touch-pan-x"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                    <span>50 jerseys</span>
                    <span>2,500 jerseys</span>
                    <span>5,000 jerseys</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">Watermark Logo Rate</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setUseWatermark(true)}
                      className={`p-3 rounded-xl text-xs font-bold transition-all border text-left ${
                        useWatermark
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <div className="font-extrabold text-sm text-white">₹3 / pc</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Watermark Logo ON (Discount Rate)</div>
                    </button>
                    <button
                      onClick={() => setUseWatermark(false)}
                      className={`p-3 rounded-xl text-xs font-bold transition-all border text-left ${
                        !useWatermark
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <div className="font-extrabold text-sm text-white">₹5 / pc</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Watermark Logo OFF (Standard Rate)</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400">
              💡 Calculated at 4 printable panels per kit (Front, Back, LHS, RHS) @ average operator cost of ₹150/hr.
            </div>
          </motion.div>

          {/* Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                Your Estimated Production Returns
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-xs md:text-sm font-semibold text-slate-300">Manual Preparation Time</span>
                  <span className="font-bold text-rose-400 text-lg">{stats.manualHours} Hours</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-xs md:text-sm font-semibold text-slate-300">With FiveNest Web Studio</span>
                  <span className="font-bold text-cyan-400 text-lg">{stats.fivenestMins} Minutes</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                  <span className="text-xs md:text-sm font-bold text-slate-200">Estimated Monthly Wallet Cost</span>
                  <span className="font-black text-cyan-300 text-xl">₹{stats.walletCost.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                  <span className="text-xs md:text-sm font-black text-white">Net Factory Money Saved / Month</span>
                  <span className="font-black text-emerald-300 text-2xl">₹{stats.netMoneySaved.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <Link to="/studio" className="block w-full mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 cursor-pointer"
              >
                Start Saving Today — Create Free Account
                <ArrowRight size={18} />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ROICalculator;
