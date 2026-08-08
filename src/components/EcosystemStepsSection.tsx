import { motion } from "framer-motion";
import { ExternalLink, Palette, Package, Sliders, Cpu, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const ecosystemSteps = [
  {
    stepNumber: "01",
    stepBadge: "STEP 1: DESIGN & MOCKUP",
    title: "Design Hub",
    subtitle: "3D Visualizer & Template Creator",
    description: "Browse 3D jersey designs, customize apparel graphics, logos, colorways & export base sublimation artwork patterns.",
    link: "https://designs.fivenest.in",
    isExternal: true,
    buttonText: "Open Design Hub",
    icon: Palette,
    accentColor: "from-cyan-500 to-sky-500",
    glowColor: "cyan",
    tag: "designs.fivenest.in"
  },
  {
    stepNumber: "02",
    stepBadge: "STEP 2: ROSTER & ORDERS",
    title: "Order Portal",
    subtitle: "Player Details & Customer CRM",
    description: "Upload Excel/CSV player rosters, player names, numbers & sizes. Auto-generate invoices and manage customer memory.",
    link: "/orders",
    isExternal: false,
    buttonText: "Open Order Portal",
    icon: Package,
    accentColor: "from-sky-500 to-blue-500",
    glowColor: "sky",
    tag: "/orders"
  },
  {
    stepNumber: "03",
    stepBadge: "STEP 3: RESIZER & RIP ENGINE",
    title: "Production Studio",
    subtitle: "Grading & Batch 300 DPI Plotting",
    description: "Auto-resize artwork, XS-7XL size grading, panel nesting, size tags (40=2), and direct 300 DPI RIP printer roll export.",
    link: "/studio",
    isExternal: false,
    buttonText: "Launch Production Studio",
    icon: Sliders,
    accentColor: "from-blue-500 to-indigo-500",
    glowColor: "blue",
    tag: "/studio"
  },
  {
    stepNumber: "04",
    stepBadge: "STEP 4: WORKSTATION PLUGINS",
    title: "FN Desktop Plugins",
    subtitle: "Photoshop, Corel & Illustrator",
    description: "1-Click desktop extensions to auto-generate artwork panels, apply collar/sleeve actions, and automate directly on your PC.",
    link: "/plugins",
    isExternal: false,
    buttonText: "Get FN Plugins",
    icon: Cpu,
    accentColor: "from-indigo-500 to-purple-500",
    glowColor: "indigo",
    tag: "/plugins"
  }
];

export const EcosystemStepsSection = () => {
  return (
    <section id="process-workflow" className="py-20 md:py-32 relative overflow-hidden bg-slate-950/90 border-y border-slate-800/80">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4 inline-flex items-center gap-2 shadow-lg shadow-cyan-500/10">
            <Sparkles size={14} /> Complete 4-Step Sportswear Production Ecosystem
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
            From Design to Print in <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">4 Simple Steps</span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg">
            FiveNest unifies the complete sportswear workflow: 3D Design, Order Rosters, Auto-Resizer Production Studio, and Workstation Plugins.
          </p>
        </motion.div>

        {/* 4-Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {ecosystemSteps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={step.stepNumber}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="relative rounded-3xl p-6 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 shadow-2xl flex flex-col justify-between group backdrop-blur-xl"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.accentColor} p-0.5 shadow-lg shadow-cyan-500/20`}>
                      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-white">
                        <IconComponent size={22} />
                      </div>
                    </div>
                    <span className="text-3xl font-black text-slate-700 group-hover:text-cyan-400 transition-colors">
                      {step.stepNumber}
                    </span>
                  </div>

                  {/* Badge */}
                  <div className="inline-block px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider mb-3">
                    {step.stepBadge}
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-xl font-black text-white mb-1 leading-snug">{step.title}</h3>
                  <p className="text-xs font-bold text-cyan-300/80 mb-3">{step.subtitle}</p>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed mb-6">{step.description}</p>
                </div>

                {/* Card Action Link */}
                <div className="pt-4 border-t border-slate-800/80">
                  {step.isExternal ? (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-opacity"
                    >
                      <span>{step.buttonText}</span>
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <Link
                      to={step.link}
                      className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <span>{step.buttonText}</span>
                      <ArrowRight size={14} className="text-cyan-400" />
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Step Flow Connection Indicator */}
        <div className="mt-12 text-center flex items-center justify-center gap-3 text-xs text-slate-400">
          <CheckCircle2 size={16} className="text-cyan-400" />
          <span>All 4 modules sync automatically with your FiveNest Factory Account & Wallet</span>
        </div>
      </div>
    </section>
  );
};
