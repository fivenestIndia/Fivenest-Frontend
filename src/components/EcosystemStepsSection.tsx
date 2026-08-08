import { motion } from "framer-motion";
import { ExternalLink, Palette, Package, Sliders, Cpu, ArrowRight, Sparkles, CheckCircle2, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const ecosystemSteps = [
  {
    stepNumber: "01",
    stepBadge: "STEP 1: DESIGN & PAYMENT",
    title: "Design Hub",
    subtitle: "3D Design Selection & Checkout",
    description: "Select 3D sportswear design from Design Hub, customize pattern & download it. Payment deducts from wallet or via instant on-the-spot checkout.",
    highlights: ["Select & Download 3D Jersey Patterns", "Deduct from Wallet or Pay On-The-Spot"],
    link: "https://designs.fivenest.in",
    isExternal: true,
    buttonText: "Open Design Hub",
    icon: Palette,
    accentColor: "from-cyan-400 via-sky-400 to-blue-500",
  },
  {
    stepNumber: "02",
    stepBadge: "STEP 2: ROSTER & CUSTOMER",
    title: "Order Portal",
    subtitle: "Customer & Roster Data Entry",
    description: "Enter customer details and order roster data (player names, numbers & XS-7XL sizes) or import instantly from Excel/CSV files.",
    highlights: ["Customer Details & Order CRM", "Excel/CSV Player Roster Import"],
    link: "/orders",
    isExternal: false,
    buttonText: "Open Order Portal",
    icon: Package,
    accentColor: "from-sky-400 via-blue-500 to-indigo-500",
  },
  {
    stepNumber: "03",
    stepBadge: "STEP 3: ZIP/JPG & RIP EXPORT",
    title: "Production Studio",
    subtitle: "Artwork Resizer & 300 DPI Export",
    description: "Upload design ZIP file or JPG data + Excel roster sheet. Production Studio auto-resizes artwork & exports print-ready plotter files in seconds!",
    highlights: ["Upload ZIP/JPG Artwork & Excel Data", "Export 300 DPI Print File in Seconds"],
    link: "/studio",
    isExternal: false,
    buttonText: "Launch Production Studio",
    icon: Sliders,
    accentColor: "from-blue-500 via-indigo-500 to-purple-500",
  },
  {
    stepNumber: "04",
    stepBadge: "STEP 4: WORKSTATION PLUGINS",
    title: "FN Desktop Plugins",
    subtitle: "Photoshop & Corel Automation",
    description: "For local PC desktop printing units — 1-click desktop extension panels for Photoshop & CorelDraw for automated batch exports on your workstation.",
    highlights: ["Photoshop & Corel Extension Panels", "1-Click Workstation Batch Automation"],
    link: "/plugins",
    isExternal: false,
    buttonText: "Get Desktop Plugins",
    icon: Cpu,
    accentColor: "from-indigo-500 via-purple-500 to-pink-500",
  }
];

export const EcosystemStepsSection = () => {
  return (
    <section id="process-ecosystem" className="py-20 md:py-32 relative overflow-hidden bg-slate-950 border-y border-slate-800/80">
      {/* Ambient Radial Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-500/10 rounded-full blur-[170px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-4xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4 inline-flex items-center gap-2 shadow-lg shadow-cyan-500/10">
            <Zap size={14} className="text-cyan-400" /> Hassle-Free Factory & Printing Unit Workflow
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 tracking-tight leading-tight">
            How Factory & Printing Business Owners Run Every Order <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Hassle-Free with Ultra-Fast Production
            </span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            Eliminate artwork delays and manual copy-paste errors. From 3D design selection & wallet checkout to automated ZIP/JPG artwork resizing and instant 300 DPI plotter exports.
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
                  <div className="flex items-center justify-between mb-5">
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
                  <p className="text-xs font-bold text-cyan-300/90 mb-3">{step.subtitle}</p>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed mb-5">{step.description}</p>

                  {/* Feature Highlights */}
                  <div className="space-y-2 mb-6 pt-3 border-t border-slate-800/60">
                    {step.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300 font-medium">
                        <CheckCircle2 size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Button */}
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

        {/* Bottom Banner Callout */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-14 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-blue-950/40 border border-cyan-500/30 max-w-4xl mx-auto text-center backdrop-blur-xl shadow-2xl"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h4 className="text-base md:text-lg font-black text-white mb-1 flex items-center gap-2">
                <Sparkles size={18} className="text-cyan-400" />
                <span>Ready to Automate Your Sportswear Printing Factory?</span>
              </h4>
              <p className="text-xs md:text-sm text-slate-300">
                Join 200+ Indian sublimation factories generating print-ready rolls in seconds.
              </p>
            </div>
            <Link to="/studio" className="flex-shrink-0 w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-opacity">
                <span>Start Production Now</span>
                <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
