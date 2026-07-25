import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

const errorSafeguards = [
  {
    title: "Wrong Player Names",
    desc: "AI Roster Reader automatically cross-checks typos against Excel columns and corrects formatting.",
  },
  {
    title: "Wrong Jersey Numbers",
    desc: "Prevents duplicate number assignments and missing numbers across single or double-digit rosters.",
  },
  {
    title: "Wrong Sizes",
    desc: "Auto-grades physical inch measurements for XS, S, M, L, XL, 2XL, 3XL, 4XL with zero manual distortion.",
  },
  {
    title: "Duplicate Order IDs",
    desc: "Auto-stamps unique customer job IDs (`INV-2026-084`) on every panel file name to prevent factory mix-ups.",
  },
  {
    title: "Missing Sleeves",
    desc: "Guarantees Left Sleeve (LHS) and Right Sleeve (RHS) pair matching for both Half and Full sleeves.",
  },
  {
    title: "Wrong Print Dimensions",
    desc: "Locks export files at true 300 DPI resolution formatted precisely to continuous roll widths.",
  },
];

const ErrorPreventionSection = () => {
  return (
    <section id="error-prevention" className="py-24 md:py-36 relative overflow-hidden bg-slate-950/60 border-t border-slate-800">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 max-w-fit mx-auto">
            <ShieldAlert size={14} />
            0% Fabric Misprint Loss
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Prevent Expensive <br />
            <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
              Printing & Stitching Mistakes
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Human operators make mistakes when tired. FiveNest automated validation checks every detail before plotting.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {errorSafeguards.map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4 }}
              key={item.title}
              className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
              </div>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed pl-11">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ErrorPreventionSection;
