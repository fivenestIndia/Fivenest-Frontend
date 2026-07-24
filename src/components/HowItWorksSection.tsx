import { motion } from "framer-motion";
import { UploadCloud, Cpu, Download, CheckCircle2 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UploadCloud,
    title: "Upload Roster & Setup Artwork",
    desc: "Upload Excel/CSV roster sheet or paste image notes. Position front, back, and sleeve artwork layers.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI Nesting & Grading Engine",
    desc: "FiveNest automatically grades dimensions across S, M, L, XL, XXL and packs front, back & sleeve panels.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    step: "03",
    icon: Download,
    title: "High-Res 300 DPI Export",
    desc: "Renders printable panels with size tags (40=2) and brand watermarks into single ZIP or continuous roll PDF.",
    color: "from-amber-500 to-orange-500",
  },
  {
    step: "04",
    icon: CheckCircle2,
    title: "Direct Plotter Printing",
    desc: "Files are perfectly named, sized, and ready to send straight to your sublimation plotter printer.",
    color: "from-emerald-500 to-teal-500",
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
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block">
            ⚡ Simple 4-Step Workflow
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            How FiveNest <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Automates Production</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            From raw roster spreadsheets to ready-to-print sublimation rolls in under 3 minutes.
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
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
