import { motion } from "framer-motion";
import { Zap, FileSpreadsheet, Maximize2, Tag, Printer, Layers, Sparkles, CheckCircle } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 md:py-36 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
            <Sparkles size={14} />
            <span>Built for High-Volume Production</span>
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight text-white">
            Everything You Need to <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Automate Jersey Printing
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Eliminate manual Photoshop scaling & repetitive file renaming. Process 100+ player rosters with one click.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {/* Big card - Bulk CSV & AI Roster */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="md:col-span-2 md:row-span-2 rounded-3xl p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300 shadow-xl"
          >
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-500" />

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400 shadow-lg shadow-cyan-500/10">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3">Bulk CSV & AI Image Roster Parsing</h3>
                <p className="text-slate-400 text-sm md:text-base mb-8 max-w-lg leading-relaxed">
                  Upload an Excel/CSV file or paste an image snippet of hand-written roster notes. FiveNest automatically structures names, numbers, sizes, and formats print-ready files instantly.
                </p>
              </div>

              {/* Interactive Mini Roster Preview Card */}
              <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 font-mono text-xs space-y-2.5 max-w-md shadow-2xl backdrop-blur-md">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 font-sans font-bold text-slate-300">
                    <CheckCircle size={14} className="text-emerald-400" /> Roster_Order_324.csv
                  </span>
                  <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10">324 Players</span>
                </div>
                <div className="flex justify-between items-center py-1 text-slate-200">
                  <span className="font-bold text-white">42 · SHARMA</span>
                  <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Front + Back · L</span>
                </div>
                <div className="flex justify-between items-center py-1 text-slate-200">
                  <span className="font-bold text-white">07 · VERMA</span>
                  <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Front + Back · M</span>
                </div>
                <div className="text-cyan-400 font-sans font-semibold text-center pt-2 border-t border-slate-800/60">
                  ✨ Auto-nesting 92 printable panels into RIP roll...
                </div>
              </div>
            </div>
          </motion.div>

          {/* Auto Resize */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl group hover:border-cyan-500/40 transition-all duration-300 shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
              <Maximize2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Exact Inch Grading</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automatic proportional scaling across XS, S, M, L, XL, XXL to exact physical print dimensions.
            </p>
          </motion.div>

          {/* Smart Rename */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl group hover:border-cyan-500/40 transition-all duration-300 shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Watermark & Size Tags</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Auto-stamps size tags (<code className="text-cyan-300 font-mono">40=2</code>) and optional 180° brand watermark logo on panels.
            </p>
          </motion.div>

          {/* Speed Increase */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl group hover:border-cyan-500/40 transition-all duration-300 shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">40x Production Speed</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">3 Min Run</span>
                <span className="text-xs text-slate-500 line-through">vs 4 Hours</span>
              </div>
            </div>
          </motion.div>

          {/* 300 DPI High Res */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl group hover:border-cyan-500/40 transition-all duration-300 shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">300 DPI RIP Export</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generates ultra-high resolution 300 DPI JPEG/ZIP/Roll PDF files ready for sublimation plotters.
            </p>
          </motion.div>

          {/* Browser & Desktop Compatibility */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="md:col-span-2 rounded-3xl p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-xl group hover:border-cyan-500/40 transition-all duration-300 shadow-xl relative overflow-hidden"
          >
            <div className="relative z-10 flex items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-2">Zero Software Installation</h3>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                  Runs directly inside any modern web browser on PC, Mac, Laptop, and Mobile phones. Zero heavy plugins or licenses required.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
