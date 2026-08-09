import { motion } from "framer-motion";
import { ExternalLink, Palette, Package, Sliders, Cpu, ArrowRight, Sparkles, CheckCircle2, Zap, Clock, ShieldCheck, CreditCard, Users2 } from "lucide-react";
import { Link } from "react-router-dom";

const mainWebSteps = [
  {
    stepNumber: "01",
    stepBadge: "STEP 1: DESIGN & PAYMENT",
    title: "Design Hub",
    subtitle: "3D Design Selection & Checkout",
    description: "Select 3D sportswear design from Design Hub, customize pattern & download it. Payment deducts from wallet or via instant on-the-spot checkout.",
    highlights: ["Select & Download 3D Jersey Patterns", "Wallet Deduct or On-The-Spot Payment"],
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
    highlights: ["Customer Memory CRM & Custom Invoice", "3-Panel Factory Expense Management"],
    link: "/orders",
    isExternal: false,
    buttonText: "Open Order Portal",
    icon: Package,
    accentColor: "from-sky-400 via-blue-500 to-indigo-500",
  },
  {
    stepNumber: "03",
    stepBadge: "STEP 3: WEB PRODUCTION STUDIO",
    title: "Production Studio (Web)",
    subtitle: "Ultra-Fast (Processes in Seconds)",
    description: "Upload design ZIP file or JPG data + Excel roster sheet. Web Studio auto-resizes artwork & exports print-ready plotter files in seconds! Charges ₹3 to ₹5 per pc.",
    highlights: ["Processes Artwork in a Few Seconds", "Pay ₹3 - ₹5 / pc (Wallet or Spot Pay)"],
    link: "/studio",
    isExternal: false,
    buttonText: "Launch Web Studio (Seconds)",
    icon: Sliders,
    accentColor: "from-blue-500 via-indigo-500 to-purple-500",
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
            <Zap size={14} className="text-cyan-400" /> 3-Step Main Web Process Ecosystem
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 tracking-tight leading-tight">
            How Printing & Factory Owners Run Every Order <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Hassle-Free in 3 Main Web Steps
            </span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            From 3D design selection & wallet checkout to automated ZIP/JPG artwork resizing and instant 300 DPI plotter exports.
          </p>
        </motion.div>

        {/* 3 Main Web Process Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {mainWebSteps.map((step, idx) => {
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

        {/* 💻 DESKTOP PLUGINS ALTERNATIVE WORKSTATION BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-950 border border-purple-500/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-extrabold uppercase tracking-wider">
                <Cpu size={14} className="text-purple-400" /> Alternative Desktop Software Option
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                FN Desktop Plugins (Photoshop & Corel Extension Panel)
              </h3>

              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                Prefer desktop workstation control? Installed directly inside Adobe Photoshop & CorelDraw. Turns <strong>2-hour Photoshop jobs into 5 to 10 minutes</strong> with higher manual customization, <strong>Auto Billing</strong> & <strong>Multiple Team Process</strong>!
              </p>

              {/* Web vs Plugin Quick Comparison Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Web Studio</span>
                  <span className="text-xs font-black text-cyan-400">Processes in Seconds</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">₹3 - ₹5 / pc (Wallet)</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-purple-500/30">
                  <span className="text-[10px] text-purple-400 font-bold uppercase block">Desktop Plugin</span>
                  <span className="text-xs font-black text-purple-300">5-10 Min Batch</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Monthly Subscription</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Auto Billing</span>
                  <span className="text-xs font-black text-emerald-400">Enterprise Plugin</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Automated Receipts</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Multi-Team</span>
                  <span className="text-xs font-black text-amber-400">Multi-User Seats</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Enterprise Workstation</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-3 justify-center items-center">
              <Link to="/plugins" className="w-full">
                <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 text-white font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 hover:opacity-95 transition-all cursor-pointer">
                  <Cpu size={18} />
                  <span>Explore Desktop Plugins</span>
                  <ArrowRight size={16} />
                </button>
              </Link>
              <span className="text-[10px] font-bold text-purple-300">Monthly Plans: ₹500, ₹1000, ₹1250, ₹1500/mo</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
