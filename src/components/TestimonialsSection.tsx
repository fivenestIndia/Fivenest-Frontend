import { motion } from "framer-motion";
import { Star, Building2, Quote, CheckCircle2 } from "lucide-react";

const testimonials = [
  {
    company: "RK Sportswear",
    location: "Surat, Gujarat",
    production: "Prints 18,000 jerseys / month",
    avatar: "🏭",
    quote: "FiveNest Web Studio reduced our daily artwork preparation time from 4 hours to just 18 minutes. The Pay-As-You-Go wallet model means we only pay when orders are generated.",
    author: "Rajesh Kumar",
    role: "Factory Managing Director",
    highlight: "4 Hours → 18 Mins",
  },
  {
    company: "National Apparel Unit",
    location: "Ludhiana, Punjab",
    production: "Prints 12,000 jerseys / month",
    avatar: "⚡",
    quote: "We used to lose thousands every month on player name spelling typos and wrong size prints. FiveNest eliminated misprint errors from 8% down to exactly 0%.",
    author: "Manpreet Singh",
    role: "Head of Operations",
    highlight: "8% Misprints → 0%",
  },
  {
    company: "Tirupur Tex Prints",
    location: "Tirupur, Tamil Nadu",
    production: "Prints 25,000 jerseys / month",
    avatar: "🏆",
    quote: "The 300 DPI continuous roll export runs smoothly on our Mimaki and Epson plotters. We save over ₹65,000 every month in operator labor costs alone.",
    author: "K. Subramanian",
    role: "Production Supervisor",
    highlight: "Saves ₹65,000 / month",
  },
];

const TestimonialsSection = () => {
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
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 max-w-fit mx-auto">
            <Building2 size={14} />
            Verified Factory Reviews
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Trusted by Commercial <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Sportswear Manufacturers
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Real factory metrics, production volumes, and monthly savings from active users.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -6 }}
              key={t.company}
              className="rounded-3xl p-6 md:p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-black text-white">{t.company}</h3>
                    <div className="text-xs text-cyan-400 font-semibold">{t.location}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{t.production}</div>
                  </div>
                  <div className="text-3xl">{t.avatar}</div>
                </div>

                {/* Rating stars */}
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} size={14} fill="currentColor" />
                  ))}
                </div>

                {/* Highlight Badge */}
                <div className="mb-4 inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                  ⚡ Result: {t.highlight}
                </div>

                {/* Quote */}
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic mb-6">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <div className="font-bold text-white text-xs">{t.author}</div>
                <div className="text-[10px] text-slate-400">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
