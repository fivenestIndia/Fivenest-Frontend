import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Play, Zap, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const useCountUp = (end: number, duration = 2000, suffix = "") => {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setValue(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return { ref, display: `${value}${suffix}` };
};

const stats = [
  { end: 1000, suffix: "+", label: "Panels Processed / Min" },
  { end: 85, suffix: "%", label: "Manual Time Saved" },
  { end: 5, suffix: "x", label: "Faster Production RIP" },
];

const HeroSection = () => {
  const counters = stats.map((s) => useCountUp(s.end, s.end > 100 ? 2000 : 1500, s.suffix));

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Dynamic Background Glow & Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] md:w-[800px] h-[500px] md:h-[800px] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Glowing Top Badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-6 shadow-lg shadow-cyan-500/10"
          >
            <Zap size={14} className="animate-bounce text-cyan-400" />
            <span>Next-Gen Sublimation Nesting & RIP Automation</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.02] tracking-tight text-white mb-6"
          >
            Automate Jersey{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(10,203,249,0.3)]">
              Sublimation & Nesting
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Instantly scale 100+ player roster files into print-ready 300 DPI high-res panel layouts.
            Built specifically for sportswear apparel manufacturers & print houses.
          </motion.p>

          {/* Call to Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link to="/studio" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 35px rgba(10, 203, 249, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-extrabold text-lg flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/25"
              >
                <Sparkles size={20} />
                Launch Web Studio (Free)
                <ArrowRight size={18} />
              </motion.button>
            </Link>

            <a href="#how-it-works" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-700 bg-slate-900/60 backdrop-blur-md text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Play size={18} className="text-cyan-400 fill-cyan-400" />
                See How It Works
              </motion.button>
            </a>
          </motion.div>

          {/* Quick Benefit Tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center items-center gap-6 text-xs md:text-sm text-slate-400 mb-16"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> No Photoshop Required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> 100% Web Browser RIP
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-cyan-400" /> 300 DPI Export Ready
            </span>
          </motion.div>
        </motion.div>

        {/* Interactive Studio Preview Card Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-5xl mx-auto rounded-2xl md:rounded-3xl p-2 md:p-3 bg-gradient-to-b from-slate-700/50 via-slate-800/30 to-black/80 border border-slate-700/50 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl"
        >
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
            {/* Top Mac-style Window Bar */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">FiveNest Web Studio — Nesting Engine & Production RIP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">300 DPI High-Res</span>
              </div>
            </div>

            {/* Interactive Preview Graphic */}
            <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center p-6 group">
              <img
                src="/logo.svg"
                alt="Studio Engine Preview"
                className="w-32 md:w-48 h-auto object-contain drop-shadow-[0_0_50px_rgba(10,203,249,0.4)] transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                    32
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Full Team Order Roster Auto-Nested</h4>
                    <p className="text-xs text-slate-400">Front, Back, Sleeves & Size Watermarks packed on roll</p>
                  </div>
                </div>
                <Link to="/studio">
                  <button className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap">
                    Test Live Studio <ArrowRight size={12} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Animated Stats Section */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              key={stat.label}
              ref={counters[i].ref}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md text-center hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                {counters[i].display}
              </div>
              <div className="text-xs uppercase tracking-widest text-slate-400 mt-2 font-semibold">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
