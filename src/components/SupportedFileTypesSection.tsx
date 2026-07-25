import { motion } from "framer-motion";
import { FileCode, FileSpreadsheet, FileImage, Download, UploadCloud, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const imports = [
  { name: "Excel & CSV (.xlsx / .csv)", desc: "Direct roster order table import", icon: FileSpreadsheet, color: "text-emerald-400" },
  { name: "PNG Graphics (.png)", desc: "Transparent background overlays & sponsor logos", icon: FileImage, color: "text-cyan-400" },
  { name: "JPEG Backgrounds (.jpg)", desc: "Full-color sublimation master patterns", icon: FileImage, color: "text-blue-400" },
  { name: "WhatsApp Image Snippets", desc: "AI Roster Reader parses hand-written photo notes", icon: FileCode, color: "text-purple-400" },
];

const exports = [
  { name: "JPG (300 DPI High-Res)", desc: "Ultra-sharp individual or roll panel files", icon: FileImage, color: "text-cyan-400" },
  { name: "PDF (Print Roll Layout)", desc: "Continuous sublimation plotter roll format", icon: FileCode, color: "text-emerald-400" },
  { name: "ZIP (Batch Packages)", desc: "Organized folders for fast plotter queueing", icon: Download, color: "text-amber-400" },
  { name: "Continuous Roll Layout", desc: "Sequential Front, Back & Sleeve roll packing", icon: UploadCloud, color: "text-purple-400" },
];

const SupportedFileTypesSection = () => {
  return (
    <section id="supported-formats" className="py-24 md:py-36 relative overflow-hidden bg-slate-950/80 border-t border-slate-800">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 max-w-fit mx-auto">
            📁 Format Compatibility
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Supported Import <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              & Export File Types
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Seamlessly import your roster spreadsheets and export plot-ready 300 DPI files for your printer.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {/* IMPORTS COLUMN */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-6 md:p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Supported Imports</h3>
                  <p className="text-xs text-slate-400">Upload order sheets & artwork graphics</p>
                </div>
              </div>

              <div className="space-y-4">
                {imports.map((imp) => {
                  const Icon = imp.icon;
                  return (
                    <div key={imp.name} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <div className={`p-2 rounded-xl bg-slate-900 ${imp.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-cyan-400" />
                          {imp.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{imp.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* EXPORTS COLUMN */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-6 md:p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Supported Exports</h3>
                  <p className="text-xs text-slate-400">Generate 300 DPI plot-ready packages</p>
                </div>
              </div>

              <div className="space-y-4">
                {exports.map((exp) => {
                  const Icon = exp.icon;
                  return (
                    <div key={exp.name} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <div className={`p-2 rounded-xl bg-slate-900 ${exp.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-400" />
                          {exp.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{exp.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SupportedFileTypesSection;
