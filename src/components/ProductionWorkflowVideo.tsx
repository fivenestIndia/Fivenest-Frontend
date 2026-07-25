import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, Cpu, LayoutGrid, Printer, Play, Pause, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const workflowSteps = [
  {
    id: 1,
    title: "1. Roster Import",
    subtitle: "Import CSV or paste hand-written roster image notes",
    icon: FileSpreadsheet,
    color: "from-cyan-500 to-blue-500",
    badge: "CSV / Image",
    detail: "Reads 100+ player names, numbers, sizes (S, M, L, XL, XXL) & auto-corrects typos.",
  },
  {
    id: 2,
    title: "2. AI Auto-Grading",
    subtitle: "Proportional pattern scaling & inch calculation",
    icon: Cpu,
    color: "from-purple-500 to-indigo-500",
    badge: "AI RIP Engine",
    detail: "Calculates exact chest width, height, armholes & sleeve lengths across all sizes in seconds.",
  },
  {
    id: 3,
    title: "3. Panel Nesting",
    subtitle: "Front, Back, Sleeves & Watermark Logo layout",
    icon: LayoutGrid,
    color: "from-amber-500 to-orange-500",
    badge: "Nesting Engine",
    detail: "Packs 92+ printable panels onto continuous sublimation roll with 40=2 size tags.",
  },
  {
    id: 4,
    title: "4. 300 DPI Export",
    subtitle: "High-resolution plot-ready file generation",
    icon: Printer,
    color: "from-emerald-500 to-teal-500",
    badge: "Plotter Ready",
    detail: "Generates 300 DPI JPEGs or Roll PDF files formatted directly for Epson/Mimaki plotters.",
  },
];

const ProductionWorkflowVideo = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % workflowSteps.length) + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentStep = workflowSteps.find((s) => s.id === activeStep) || workflowSteps[0];
  const StepIcon = currentStep.icon;

  return (
    <section className="py-24 md:py-36 relative overflow-hidden bg-slate-950">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10">
            🎬 30-Second Production Demo
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Watch the <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">300 DPI Nesting Engine</span> in Action
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            See how FiveNest transforms raw spreadsheets into plot-ready sublimation rolls live.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 p-4 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Controls & Steps Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              {workflowSteps.map((s) => {
                const Icon = s.icon;
                const isActive = s.id === activeStep;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveStep(s.id);
                      setIsPlaying(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ${
                      isActive
                        ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 scale-105"
                        : "bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{s.title}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? "Pause Loop" : "Play Auto Loop"}</span>
            </button>
          </div>

          {/* Interactive Screen Showcase */}
          <div className="relative aspect-[16/9] max-h-[480px] w-full rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden flex flex-col justify-between p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.4 }}
                className="h-full flex flex-col justify-between"
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${currentStep.color} p-0.5 shadow-lg`}>
                      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-white">
                        <StepIcon size={22} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-white">{currentStep.title}</h3>
                      <p className="text-xs md:text-sm text-slate-400">{currentStep.subtitle}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {currentStep.badge}
                  </span>
                </div>

                {/* Main Visual Display */}
                <div className="my-6 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center shadow-inner">
                  {activeStep === 1 && (
                    <div className="space-y-3 font-mono text-xs w-full max-w-md text-left bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="text-cyan-400 font-bold border-b border-slate-800 pb-2 flex justify-between">
                        <span>CSV Order Sheet Imported</span>
                        <span>124 Jersey Records</span>
                      </div>
                      <div className="text-slate-300 flex justify-between">
                        <span>01. RODRIGUEZ</span>
                        <span className="text-slate-500">10 · Size L (Qty: 2)</span>
                      </div>
                      <div className="text-slate-300 flex justify-between">
                        <span>02. SHARMA</span>
                        <span className="text-slate-500">07 · Size M (Qty: 1)</span>
                      </div>
                      <div className="text-emerald-400 font-sans text-center pt-2 font-bold">
                        ✓ All 124 records parsed & validated instantly!
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-4 max-w-md">
                      <div className="text-3xl font-black text-white">Proportional Scale Engine</div>
                      <p className="text-xs text-slate-400">{currentStep.detail}</p>
                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 3.5, ease: "linear" }}
                          className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-3 max-w-lg w-full">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>Auto-Nesting Layout Preview</span>
                        <span className="text-amber-400">92 Panels Packed</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded text-[10px] text-cyan-300">Front 42=2</div>
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded text-[10px] text-cyan-300">Back 42=2</div>
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded text-[10px] text-purple-300">LHS 40=1</div>
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded text-[10px] text-purple-300">RHS 40=1</div>
                      </div>
                    </div>
                  )}

                  {activeStep === 4 && (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 size={36} />
                      </div>
                      <div className="text-xl font-extrabold text-white">300 DPI Export Complete</div>
                      <p className="text-xs text-slate-400">Formatted for Epson, Mimaki & Roland Plotters</p>
                    </div>
                  )}
                </div>

                {/* Footer bar */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Step {activeStep} of 4</span>
                  <Link to="/studio" className="text-cyan-400 font-bold hover:underline flex items-center gap-1">
                    Try Live Web Studio <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductionWorkflowVideo;
