import { motion } from "framer-motion";
import { Building2, Printer, CheckCircle2, Cpu, Monitor, Sparkles } from "lucide-react";

const factoryFeatures = [
  {
    title: "Live Sublimation Roll Plotters",
    desc: "Exports continuous 300 DPI RIP files directly formatted for Epson, Mimaki, and Roland plotters.",
    icon: Printer,
  },
  {
    title: "100% Browser-Based Workspace",
    desc: "Runs on any factory PC, laptop, or tablet screen. No software downloads or USB keys required.",
    icon: Monitor,
  },
  {
    title: "Fast Printing Speed",
    desc: "Plotters run continuously with 92+ pre-graded jersey panels without stopping or recalculating.",
    icon: Cpu,
  },
];

const RealFactorySection = () => {
  return (
    <section className="py-24 md:py-36 relative overflow-hidden bg-slate-950/80 border-t border-slate-800">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 max-w-fit mx-auto">
            <Building2 size={14} />
            Real Production Environment
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Running Inside Real <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Sportswear Production Units
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            See how FiveNest powers commercial sublimation plotters, heat presses, and factory operators daily.
          </p>
        </motion.div>

        {/* Real Factory Showcase Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {factoryFeatures.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                whileHover={{ y: -6 }}
                key={f.title}
                className="rounded-3xl p-6 md:p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 size={14} />
                  <span>Factory Verified Workflow</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RealFactorySection;
