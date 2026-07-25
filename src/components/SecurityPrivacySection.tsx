import { motion } from "framer-motion";
import { Lock, ShieldCheck, Database, FileKey, EyeOff, Server } from "lucide-react";

const securityPillars = [
  {
    title: "Files Stay 100% Private",
    desc: "Your uploaded vector patterns and customer roster sheets are private to your account only.",
    icon: EyeOff,
  },
  {
    title: "Bank-Grade HTTPS SSL",
    desc: "All browser data transmission is encrypted using 256-bit HTTPS SSL security protocols.",
    icon: Lock,
  },
  {
    title: "Automatic Cloud Backups",
    desc: "Your size databases and design config presets are backed up securely in the cloud.",
    icon: Database,
  },
  {
    title: "Zero Artwork Sharing",
    desc: "We never share, sell, or reuse customer artwork, fonts, or sponsor logos with anyone.",
    icon: FileKey,
  },
  {
    title: "Supabase Row-Level Security",
    desc: "Database access is strictly restricted per factory user session (`auth.uid() = user_id`).",
    icon: Server,
  },
  {
    title: "Client-Side Processing Option",
    desc: "Nesting calculations are performed in your browser Web Worker for instant local safety.",
    icon: ShieldCheck,
  },
];

const SecurityPrivacySection = () => {
  return (
    <section className="py-24 md:py-36 relative overflow-hidden bg-slate-950 border-t border-slate-800">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5 max-w-fit mx-auto">
            <Lock size={14} />
            Enterprise Security Guarantees
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            100% Private & Secure <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Factory Artwork Cloud
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            We treat your customer artwork, team rosters, and vector patterns with strict confidentiality.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {securityPillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4 }}
                key={p.title}
                className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300 shadow-xl"
              >
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed">{p.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SecurityPrivacySection;
