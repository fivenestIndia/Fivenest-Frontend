import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, IndianRupee, Zap, Sparkles, ArrowRight } from "lucide-react";

const ROICalculator = () => {
  const [files, setFiles] = useState(150);
  const [hourlyCost, setHourlyCost] = useState(150);
  const [days, setDays] = useState(26);

  const result = useMemo(() => {
    // Manual: ~1.5 min per file. Fivenest: ~0.6 sec per file.
    const manualMinPerDay = files * 1.5;
    const fivenestMinPerDay = files * 0.01;
    const minutesSavedPerDay = manualMinPerDay - fivenestMinPerDay;
    const hoursSavedPerMonth = (minutesSavedPerDay * days) / 60;
    const moneySavedPerMonth = Math.round(hoursSavedPerMonth * hourlyCost);
    const moneySavedPerYear = moneySavedPerMonth * 12;
    const planCost = 2000;
    const roi = Math.round(((moneySavedPerMonth - planCost) / planCost) * 100);
    return {
      hoursSavedPerMonth: Math.round(hoursSavedPerMonth),
      moneySavedPerMonth,
      moneySavedPerYear,
      roi: Math.max(roi, 0),
    };
  }, [files, hourlyCost, days]);

  return (
    <section id="roi" className="py-24 md:py-36 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

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
            <span>Interactive ROI & Savings Estimator</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            See How Much You'll <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Save Every Month</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Drag the sliders below to calculate time & cost savings tailored to your factory's daily workload.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Inputs Panel */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-6 md:p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col justify-between"
          >
            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400" />
              Your Factory Production Numbers
            </h3>

            <div className="space-y-8">
              <SliderInput
                label="Daily Jersey Panels Printed"
                value={files}
                onChange={setFiles}
                min={20}
                max={1000}
                step={10}
                suffix="panels"
              />
              <SliderInput
                label="Photoshop Operator Hourly Cost"
                value={hourlyCost}
                onChange={setHourlyCost}
                min={50}
                max={500}
                step={10}
                prefix="₹"
              />
              <SliderInput
                label="Working Production Days / Month"
                value={days}
                onChange={setDays}
                min={20}
                max={30}
                step={1}
                suffix="days"
              />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400">
              💡 Based on average manual Photoshop RIP time of 1.5 mins vs 0.6 seconds with FiveNest.
            </div>
          </motion.div>

          {/* Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                Estimated Monthly Factory Return
              </h3>

              <div className="space-y-4">
                <ResultCard
                  icon={<Clock className="w-5 h-5" />}
                  label="Time Saved / Month"
                  value={`${result.hoursSavedPerMonth} Hours`}
                />
                <ResultCard
                  icon={<IndianRupee className="w-5 h-5" />}
                  label="Money Saved / Month"
                  value={`₹${result.moneySavedPerMonth.toLocaleString("en-IN")}`}
                  highlight
                />
                <ResultCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Money Saved / Year"
                  value={`₹${result.moneySavedPerYear.toLocaleString("en-IN")}`}
                />
                <ResultCard
                  icon={<Zap className="w-5 h-5" />}
                  label="Estimated ROI Increase"
                  value={`${result.roi}%`}
                />
              </div>
            </div>

            <a
              href="#pricing"
              className="relative z-10 block w-full mt-8"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20"
              >
                Claim Your Savings Now
                <ArrowRight size={18} />
              </motion.button>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const SliderInput = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
}) => (
  <div>
    <div className="flex justify-between items-baseline mb-3">
      <label className="text-sm font-semibold text-slate-300">{label}</label>
      <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        {prefix}
        {value.toLocaleString("en-IN")} {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-400 touch-pan-x"
    />
  </div>
);

const ResultCard = ({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
      highlight
        ? "bg-cyan-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/5"
        : "bg-slate-950/60 border border-slate-800/80"
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${highlight ? "bg-cyan-500 text-black font-bold" : "bg-slate-800 text-cyan-400"}`}>
        {icon}
      </div>
      <span className="text-xs md:text-sm font-semibold text-slate-300">{label}</span>
    </div>
    <span className={`font-black ${highlight ? "text-2xl bg-gradient-to-r from-cyan-300 to-emerald-400 bg-clip-text text-transparent" : "text-xl text-white"}`}>
      {value}
    </span>
  </div>
);

export default ROICalculator;
