import { useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles, Upload, ShieldCheck, Star, Palette, Download, Users, Zap, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AuroraBackground from "@/components/AuroraBackground";

/* ─── Intersection observer hook ─────────────────────────────── */
const useInView = (threshold = 0.12) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

/* ─── Counter hook ────────────────────────────────────────────── */
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
            const eased = 1 - Math.pow(1 - progress, 3);
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

/* ─── Static data ─────────────────────────────────────────────── */
const stats = [
  { end: 500, suffix: "+", label: "Designs Available" },
  { end: 120, suffix: "+", label: "Verified Designers" },
  { end: 98, suffix: "%", label: "Customer Satisfaction" },
  { end: 3, suffix: "x", label: "Faster Customization" },
];

const features = [
  {
    icon: <Palette className="w-6 h-6" />,
    title: "PSD, AI, CDR & SVG Files",
    desc: "Print-ready 300 DPI source files for any sublimation or screen-print workflow.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Verified Designers",
    desc: "Every designer is vetted. Every file is checked for quality and originality.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Instant Download",
    desc: "Buy a design and download immediately. No waiting, no approvals.",
  },
  {
    icon: <Upload className="w-6 h-6" />,
    title: "Sell Your Designs",
    desc: "Upload your jersey designs and earn 70% commission on every sale.",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Trending Weekly",
    desc: "Curated collections updated weekly — always fresh, always relevant.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Designer Profiles",
    desc: "Follow top creators, discover their portfolios, and commission custom work.",
  },
];

const categories = [
  { name: "Football", emoji: "⚽", count: "180+ designs", color: "from-cyan-500/20 to-blue-600/20" },
  { name: "Cricket", emoji: "🏏", count: "95+ designs", color: "from-emerald-500/20 to-cyan-600/20" },
  { name: "Kabaddi", emoji: "🤼", count: "60+ designs", color: "from-violet-500/20 to-purple-600/20" },
  { name: "Esports", emoji: "🎮", count: "75+ designs", color: "from-orange-500/20 to-red-600/20" },
  { name: "Basketball", emoji: "🏀", count: "55+ designs", color: "from-yellow-500/20 to-orange-600/20" },
  { name: "Hockey", emoji: "🏒", count: "40+ designs", color: "from-pink-500/20 to-rose-600/20" },
];

const howItWorks = [
  {
    step: "01",
    title: "Browse & Discover",
    desc: "Search thousands of jersey designs filtered by sport, style, color, or price.",
  },
  {
    step: "02",
    title: "Preview & Customize",
    desc: "Use the real-time 3D studio to add your team name, numbers, and colors.",
  },
  {
    step: "03",
    title: "Download & Print",
    desc: "Get 300 DPI print-ready files directly into your Fivenest workflow.",
  },
];

/* ─── Component ───────────────────────────────────────────────── */
const DesignHub = () => {
  const featuresSection = useInView();
  const categoriesSection = useInView();
  const howItWorksSection = useInView();

  const counters = stats.map((s) => useCountUp(s.end, s.end > 100 ? 2000 : 1500, s.suffix));

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
        {/* Radial glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[130px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/3 blur-[80px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-violet-500/5 blur-[80px] animate-float" style={{ animationDelay: "3s" }} />
        </div>

        <div className="relative container mx-auto px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border border-primary/30 text-primary mb-8">
              <Sparkles className="w-3 h-3" />
              Fivenest Design Hub — India's #1 Sports Jersey Marketplace
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-delay-1 text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight max-w-5xl mx-auto mb-6">
            Buy & Sell{" "}
            <span className="text-gradient">World-Class</span>
            <br />
            Jersey Designs
          </h1>

          {/* Sub */}
          <p className="animate-fade-up-delay-2 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Thousands of professionally designed sports jerseys — PSD, AI, CDR and SVG — ready for your sublimation or screen-print production floor.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://jersey-canvas-pro.vercel.app/designs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all glow-md animate-pulse-glow"
            >
              Browse Designs <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="https://jersey-canvas-pro.vercel.app/upload"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-border text-foreground font-semibold text-lg hover:bg-secondary transition-colors"
            >
              <Upload className="w-5 h-5" /> Sell Your Designs
            </a>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto animate-fade-up-delay-3">
            {stats.map((stat, i) => (
              <div key={stat.label} ref={counters[i].ref} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-gradient glow-text">
                  {counters[i].display}
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────────── */}
      <section className="py-24 relative" ref={categoriesSection.ref}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full glass text-xs font-semibold text-primary mb-4">
              🏆 All Sports Covered
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
              Browse by <span className="text-gradient">Category</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From football to esports — find print-ready designs for every sport and every style.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <a
                key={cat.name}
                href={`https://jersey-canvas-pro.vercel.app/designs?sport=${cat.name.toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative overflow-hidden rounded-2xl glass-card p-6 border border-border/30 hover:border-primary/40 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${
                  categoriesSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 60}ms`, transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.2s, box-shadow 0.2s, scale 0.2s" }}
              >
                {/* Gradient bg */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative">
                  <div className="text-4xl mb-3">{cat.emoji}</div>
                  <div className="text-xl font-black text-foreground">{cat.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">{cat.count}</div>
                </div>

                <ArrowRight className="absolute bottom-5 right-5 w-5 h-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="py-24 relative" ref={featuresSection.ref}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full glass text-xs font-semibold text-primary mb-4">
              ⚡ Built for Print Professionals
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
              Everything You Need to <br />
              <span className="text-gradient">Grow Your Print Business</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`group glass-card rounded-2xl p-6 border border-border/30 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] ${
                  featuresSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 80}ms`, transition: "opacity 0.5s ease, transform 0.5s ease, border-color 0.2s, scale 0.2s" }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section className="py-24 relative" ref={howItWorksSection.ref}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 rounded-full glass text-xs font-semibold text-primary mb-4">
              🚀 3 Simple Steps
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
              From Browse to <span className="text-gradient">Print-Ready</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Get your jersey design files in minutes and push them straight into your Fivenest production workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((step, i) => (
              <div
                key={step.step}
                className={`relative text-center ${
                  howItWorksSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 120}ms`, transition: "opacity 0.6s ease, transform 0.6s ease" }}
              >
                {/* Connector line */}
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] right-0 h-px bg-gradient-to-r from-primary/40 to-transparent" />
                )}

                <div className="w-20 h-20 rounded-2xl glass border border-primary/30 flex items-center justify-center mx-auto mb-5 relative">
                  <span className="text-3xl font-black text-gradient">{step.step}</span>
                  <div className="absolute -inset-px rounded-2xl border border-primary/20 glow-sm" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sell CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="relative rounded-3xl glass border border-primary/20 p-10 md:p-16 text-center overflow-hidden">
            {/* Glow BG */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-primary/8 blur-[80px] pointer-events-none" />

            <div className="relative">
              <div className="inline-block px-4 py-1.5 rounded-full glass text-xs font-semibold text-primary mb-6 border border-primary/30">
                💰 Earn Up to 70% Commission
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-5 tracking-tight">
                Are You a <span className="text-gradient">Jersey Designer?</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                Upload your designs once and earn passive income from every download. Join 120+ designers already earning on Fivenest Design Hub.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://jersey-canvas-pro.vercel.app/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all glow-md animate-pulse-glow"
                >
                  <Upload className="w-5 h-5" /> Start Selling Today
                </a>
                <a
                  href="https://jersey-canvas-pro.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-border font-semibold text-lg hover:bg-secondary transition-colors"
                >
                  <Star className="w-5 h-5" /> Explore Marketplace
                </a>
              </div>

              {/* Trust badges */}
              <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> Secure Payments</span>
                <span className="flex items-center gap-1.5"><Download className="w-4 h-4 text-primary" /> Instant Downloads</span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-primary" /> Quality Verified</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> 120+ Designers</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default DesignHub;
