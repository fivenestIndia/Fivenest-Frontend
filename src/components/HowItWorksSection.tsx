import { motion } from "framer-motion";
import { UserPlus, UploadCloud, LayoutGrid, Cpu, Eye, Wallet, Download, CheckCircle2 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Create Free Account",
    desc: "Sign up in 10 seconds. Zero credit card or subscription setup required.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    step: "02",
    icon: UploadCloud,
    title: "Upload Excel / CSV",
    desc: "Import your order sheet or paste hand-written WhatsApp roster image notes.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    step: "03",
    icon: LayoutGrid,
    title: "Choose Template",
    desc: "Select sublimation pattern, neck style, sleeves, and sponsor logo positions.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    step: "04",
    icon: Cpu,
    title: "AI Generates Print Files",
    desc: "FiveNest grades XS-4XL sizes and nests 92+ panels with top-left size tags (40=2).",
    color: "from-purple-500 to-pink-500",
  },
  {
    step: "05",
    icon: Eye,
    title: "3D & Canvas Preview",
    desc: "Inspect player names, numbers, and continuous roll layout on screen.",
    color: "from-amber-500 to-orange-500",
  },
  {
    step: "06",
    icon: Wallet,
    title: "Pay Using Wallet",
    desc: "Pay only for completed exports (₹3/pc with Watermark, ₹5/pc without).",
    color: "from-emerald-500 to-teal-500",
  },
  {
    step: "07",
    icon: Download,
    title: "Download Production Files",
    desc: "Download 300 DPI high-resolution plotter files formatted for Epson/Mimaki.",
    color: "from-teal-500 to-cyan-500",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 md:py-36 relative overflow-hidden bg-slate-950/40">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10">
            ⚡ How FiveNest Works
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Simple 7-Step <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Factory Workflow</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            From raw Excel sheets to plot-ready 300 DPI sublimation rolls in under 3 minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -6 }}
                key={s.step}
                className="relative rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} p-0.5 shadow-lg`}>
                      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-white">
                        <Icon size={22} />
                      </div>
                    </div>
                    <span className="text-2xl font-black text-slate-700 group-hover:text-cyan-400 transition-colors">
                      {s.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 leading-snug">{s.title}</h3>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-xs font-semibold text-cyan-400">
                  <CheckCircle2 size={14} />
                  <span>Step {i + 1} Automated</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
