import { motion } from "framer-motion";
import { BookOpen, Sparkles, Clock, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const academyArticles = [
  {
    id: "automate-sublimation-jersey-production",
    category: "Automation & Production",
    title: "How to Automate Sportswear Sublimation Jersey Production & Save 5 Hours Daily",
    readTime: "6 Min Read",
    date: "July 2026",
    excerpt: "Learn how modern sportswear manufacturing units eliminate Photoshop bottlenecks, automate 100+ player roster sizing, and stream RIP plot files directly.",
    content: [
      "In traditional sportswear manufacturing factories, Photoshop operators spend 4 to 6 hours every day manually opening master PSD files, re-typing player names, resizing jersey panels, and exporting JPEGs one-by-one.",
      "By transitioning to an automated Web Studio workflow, factory teams import their order CSV once, and the nesting engine grades XS to 4XL dimensions, attaches 180° watermarks and top-left size tags (40=2), and renders 300 DPI plotter files in under 3 minutes.",
      "Result: 95% reduction in human misprints, 5 hours saved every single day, and lower labor cost per jersey panel."
    ],
  },
  {
    id: "photoshop-vs-web-studio-automation",
    category: "Software Comparison",
    title: "Photoshop Manual Actions vs FiveNest Web Studio RIP Automation",
    readTime: "5 Min Read",
    date: "July 2026",
    excerpt: "A deep technical comparison showing why Photoshop actions freeze on 100+ player rosters and how client-side canvas Web Workers deliver instantaneous exports.",
    content: [
      "Photoshop batch actions often fail or crash when handling long text layers, variable custom fonts, and multi-piece panel positioning due to heavy GPU memory bloat.",
      "FiveNest Web Studio utilizes pre-compiled Path2D vector paths and dedicated browser Web Workers. It handles 300 DPI exports continuously without consuming gigabytes of RAM or freezing the computer.",
      "Furthermore, size grading is automatically calculated per physical inch rather than arbitrary pixel distortion."
    ],
  },
  {
    id: "dtf-vs-sublimation-workflow-guide",
    category: "Printing Technology",
    title: "DTF vs Sublimation Print Automation: Optimizing Roll Plotter Layouts",
    readTime: "7 Min Read",
    date: "July 2026",
    excerpt: "How to configure transparent PNG layers, A4 back prints, and continuous roll widths for Epson, Mimaki, and Roland plotters.",
    content: [
      "Whether you operate 60-inch sublimation roll plotters or Direct-To-Film (DTF) printers, nesting efficiency determines your daily profit margins.",
      "FiveNest allows factory operators to toggle transparent PNG graphic overlays for DTF film runs, or full-width 300 DPI JPEG rolls for sublimation heat press transfer.",
      "Automatic spacing safeguards prevent panel overlapping and ensure zero fabric waste during heat transfer cutting."
    ],
  },
];

export default function Academy() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500 selection:text-black">
      <Navbar />

      <main className="pt-32 pb-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:underline mb-8">
            <ArrowLeft size={16} /> Return to FiveNest Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 max-w-fit mx-auto">
              <BookOpen size={14} />
              FiveNest Academy & Production Guides
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
              Master Sportswear Manufacturing <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                & Print Automation
              </span>
            </h2>
            <p className="text-slate-400 text-base md:text-lg">
              Expert articles, production workflows, and step-by-step guides to scale your factory.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {academyArticles.map((art, i) => (
              <motion.article
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                whileHover={{ y: -6 }}
                key={art.id}
                className="rounded-3xl p-6 md:p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                      {art.category}
                    </span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {art.readTime}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors leading-snug">
                    {art.title}
                  </h3>

                  <p className="text-xs md:text-sm text-slate-400 mb-6 leading-relaxed">
                    {art.excerpt}
                  </p>

                  <div className="space-y-3 mb-6 pt-4 border-t border-slate-800">
                    {art.content.map((p, idx) => (
                      <p key={idx} className="text-xs text-slate-300 leading-relaxed">
                        • {p}
                      </p>
                    ))}
                  </div>
                </div>

                <Link to="/studio">
                  <button className="w-full py-3 rounded-xl bg-slate-800/80 text-cyan-400 font-bold text-xs hover:bg-slate-800 border border-slate-700 transition-all flex items-center justify-center gap-2">
                    Try This Workflow Live <ArrowRight size={14} />
                  </button>
                </Link>
              </motion.article>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link to="/studio">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-extrabold text-base shadow-xl shadow-cyan-500/25 inline-flex items-center gap-2"
              >
                <Sparkles size={18} />
                Launch Web Studio Production Now
              </motion.button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
