import { motion } from "framer-motion";
import { TrendingUp, Clock, Users, ShieldCheck, IndianRupee, Sparkles, Building2, CheckCircle2 } from "lucide-react";

const caseStudies = [
  {
    factory: "ABC Sports Manufacturers",
    location: "Ludhiana, Punjab",
    capacity: "5,000+ Jerseys / Month",
    image: "🏭",
    before: {
      team: "3 Photoshop Operators",
      time: "6 Hours / Order",
      mistakes: "7-10 Misprints per 100 jerseys",
    },
    after: {
      team: "1 Operator (Part-Time)",
      time: "25 Minutes / Order",
      mistakes: "Zero Mistakes (100% Accuracy)",
    },
    savedAmount: "₹45,000",
    savedPeriod: "per month",
    quote: "FiveNest reduced our manual operator costs by 65%. We now finish our entire daily roster batch before lunch.",
    author: "Harpreet Singh, Production Director",
  },
  {
    factory: "Apex Sportswear Unit",
    location: "Tirupur, Tamil Nadu",
    capacity: "8,000+ Jerseys / Month",
    image: "⚡",
    before: {
      team: "4 Operators",
      time: "4 Hours per 100 Jerseys",
      mistakes: "Frequent size mismatch errors",
    },
    after: {
      team: "1 Operator",
      time: "3 Minutes per 100 Jerseys",
      mistakes: "Auto-graded inch sizing",
    },
    savedAmount: "₹62,000",
    savedPeriod: "per month",
    quote: "The 300 DPI continuous roll export feature transformed our sublimation plotter workflow completely.",
    author: "R. Venkatesh, Factory Owner",
  },
  {
    factory: "Metro Uniforms & Apparel",
    location: "Surat, Gujarat",
    capacity: "4,500+ Jerseys / Month",
    image: "🏆",
    before: {
      team: "2 Operators",
      time: "5.5 Hours Daily",
      mistakes: "8% fabric waste loss",
    },
    after: {
      team: "1 Operator",
      time: "15 Minutes Daily",
      mistakes: "0% Fabric Waste Loss",
    },
    savedAmount: "₹38,000",
    savedPeriod: "per month",
    quote: "We used to lose thousands on fabric misprints due to human name spelling typos. FiveNest eliminated typos 100%.",
    author: "Suresh Patel, Operations Head",
  },
];

const CaseStudiesSection = () => {
  return (
    <section className="py-24 md:py-36 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10">
            📊 Factory Proof & ROI Case Studies
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Real Manufacturers. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Proven Monthly Savings.
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            See how sportswear factories across India saved 5+ hours daily and thousands in operator costs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {caseStudies.map((cs, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -6 }}
              key={cs.factory}
              className="rounded-3xl p-6 md:p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
                      <Building2 size={14} />
                      <span>{cs.location}</span>
                    </div>
                    <h3 className="text-lg font-black text-white">{cs.factory}</h3>
                    <span className="text-xs text-slate-400 font-medium">{cs.capacity}</span>
                  </div>
                  <div className="text-3xl">{cs.image}</div>
                </div>

                {/* Savings Pill Highlight */}
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/30 text-center shadow-lg shadow-emerald-500/5">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <IndianRupee size={14} />
                    Verified Factory Savings
                  </div>
                  <div className="text-3xl font-black bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                    {cs.savedAmount}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">{cs.savedPeriod}</div>
                </div>

                {/* Before vs After Table */}
                <div className="space-y-3 mb-6 text-xs">
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-slate-300">
                    <div className="text-rose-400 font-bold mb-1 uppercase tracking-wider">Before FiveNest</div>
                    <div className="flex justify-between text-slate-400">
                      <span>Team: {cs.before.team}</span>
                      <span>Time: {cs.before.time}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-white font-bold">
                    <div className="text-cyan-400 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={12} /> After FiveNest
                    </div>
                    <div className="flex justify-between text-slate-200">
                      <span>Team: {cs.after.team}</span>
                      <span>Time: {cs.after.time}</span>
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-xs md:text-sm text-slate-400 italic mb-4 leading-relaxed">
                  "{cs.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-xs font-bold text-slate-300">
                — {cs.author}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudiesSection;
