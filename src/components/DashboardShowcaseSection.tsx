import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Palette, Users, Sliders, Receipt, Box, Check } from "lucide-react";
import { Link } from "react-router-dom";

const tabs = [
  {
    id: "nesting",
    label: "Nesting & 300 DPI Export",
    icon: Sliders,
    badge: "Production RIP",
    title: "Continuous Roll Nesting Engine",
    desc: "Automatically packs Front, Back, Sleeve, and A4 print panels onto continuous sublimation roll with 180° brand watermarks and 40=2 size tags.",
    highlights: ["300 DPI Ultra-High Res Export", "180° Watermark Logo (₹3/pc Discount Rate)", "Automatic Size Tag Generator"],
  },
  {
    id: "roster",
    label: "Roster Table & AI Reader",
    icon: Users,
    badge: "Smart Data Entry",
    title: "Bulk CSV & AI Image Roster Cleaner",
    desc: "Paste hand-written WhatsApp order photos or upload Excel sheets. FiveNest structures names, numbers, and sizes with zero typos.",
    highlights: ["Paste WhatsApp Image Snippets", "Batch CSV Excel Upload", "Automatic Duplicate Detection"],
  },
  {
    id: "artwork",
    label: "Artwork & 3D Preview",
    icon: Palette,
    badge: "Design Studio",
    title: "Sublimation Layer Positioning & 3D Model",
    desc: "Position front/back patterns, chest logos, torso graphics, and inspect the jersey live in 3D rotation before print generation.",
    highlights: ["Real-Time 3D Mesh Inspection", "Proportional Sleeve & Torso Alignment", "Multiple Collar & Neckline Options"],
  },
  {
    id: "billing",
    label: "Multi-User Billing System",
    icon: Receipt,
    badge: "Factory Operating System",
    title: "Customer Invoicing & Payment Links",
    desc: "Generate professional PDFs with auto-calculated rates, integrated GPay/UPI QR codes, and real-time customer tracking.",
    highlights: ["UPI & GPay QR Code Generator", "Automated PDF Tax Invoices", "User-Scoped Order Tracking"],
  },
];

const DashboardShowcaseSection = () => {
  const [activeTabId, setActiveTabId] = useState("nesting");
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

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
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10">
            🖥️ Real Software Showcase
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Built for Real Factories. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Not Stock Graphics.
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Explore the actual FiveNest Web Studio dashboard tools trusted by 200+ manufacturers.
          </p>
        </motion.div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12 max-w-4xl mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-extrabold transition-all duration-300 ${
                  isActive
                    ? "bg-cyan-500 text-black shadow-xl shadow-cyan-500/25 scale-105"
                    : "bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700"
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feature Display Card */}
        <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-center">
          {/* Details Column */}
          <motion.div
            key={activeTab.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-5 space-y-6"
          >
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {activeTab.badge}
            </span>

            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {activeTab.title}
            </h3>

            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              {activeTab.desc}
            </p>

            <div className="space-y-3 pt-2">
              {activeTab.highlights.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs md:text-sm font-semibold text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check size={12} />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link to="/studio">
                <button className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                  <Sparkles size={16} />
                  Launch This Tool Live in Web Studio
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Interactive Screen Container */}
          <motion.div
            key={`screen-${activeTab.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-7 rounded-3xl bg-slate-900 border border-slate-800 p-3 shadow-2xl relative overflow-hidden group"
          >
            <div className="rounded-2xl bg-slate-950 border border-slate-800/80 p-6 min-h-[380px] flex flex-col justify-between relative">
              {/* Top Window Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">FiveNest Web Studio v2.4</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Live Workspace</span>
              </div>

              {/* Active Tab Screen Content Mock */}
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-slate-900/50 rounded-xl border border-slate-800/60">
                {activeTab.id === "nesting" && (
                  <div className="space-y-4 w-full">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                      <span>Nesting Roster: 92 Printable Panels</span>
                      <span className="text-cyan-400">300 DPI High-Res Mode</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-slate-950 border border-cyan-500/40 rounded-lg text-left">
                        <div className="text-[10px] text-slate-400">[Front] 42=2 F</div>
                        <div className="text-xs font-bold text-white mt-1">SHARMA · 10</div>
                      </div>
                      <div className="p-3 bg-slate-950 border border-cyan-500/40 rounded-lg text-left">
                        <div className="text-[10px] text-slate-400">[Back] 42=2 B</div>
                        <div className="text-xs font-bold text-white mt-1">SHARMA · 10</div>
                      </div>
                      <div className="p-3 bg-slate-950 border border-purple-500/40 rounded-lg text-left">
                        <div className="text-[10px] text-slate-400">[Sleeve] 40=5 RHS</div>
                        <div className="text-xs font-bold text-white mt-1">VERMA · 07</div>
                      </div>
                    </div>
                    <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      ✓ FiveNest 180° Watermark Logo (₹3/pc Discount Active)
                    </div>
                  </div>
                )}

                {activeTab.id === "roster" && (
                  <div className="space-y-3 w-full text-left font-mono text-xs">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 flex justify-between">
                      <span className="font-bold text-white">01. RODRIGUEZ</span>
                      <span>Num: 10 · Size: XL · Qty: 2</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 flex justify-between">
                      <span className="font-bold text-white">02. SHARMA</span>
                      <span>Num: 07 · Size: L · Qty: 1</span>
                    </div>
                    <div className="p-2 bg-cyan-500/10 text-cyan-300 rounded text-center font-sans font-bold">
                      ✨ AI Roster Image Reader Active (Parsed WhatsApp Image Snippet)
                    </div>
                  </div>
                )}

                {activeTab.id === "artwork" && (
                  <div className="space-y-4">
                    <div className="w-24 h-24 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                      <Box size={44} className="animate-spin" style={{ animationDuration: '10s' }} />
                    </div>
                    <div className="text-sm font-bold text-white">Interactive 3D Sublimation Mesh Visualizer</div>
                    <p className="text-xs text-slate-400">Rotate & inspect player name positioning live on 3D jersey</p>
                  </div>
                )}

                {activeTab.id === "billing" && (
                  <div className="space-y-3 w-full text-left font-sans text-xs">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">Invoice #INV-2026-084</div>
                        <div className="text-slate-400 text-[10px]">Customer: Deepika Sports (92 Panels)</div>
                      </div>
                      <span className="text-emerald-400 font-bold">₹276.00</span>
                    </div>
                    <div className="p-2 bg-emerald-500/10 text-emerald-300 rounded text-center font-bold">
                      💳 Auto-Generated GPay / PhonePe UPI QR Code Included
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DashboardShowcaseSection;
