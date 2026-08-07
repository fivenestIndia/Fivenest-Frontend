import { useEffect, useRef, useState } from "react";

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
  { end: 1000, suffix: "+", label: "Files Processed Per Run" },
  { end: 70, suffix: "%", label: "Manual Time Saved" },
  { end: 3, suffix: "x", label: "Faster Production Output" },
];

const HeroSection = () => {
  const counters = stats.map((s) => useCountUp(s.end, s.end > 100 ? 2000 : 1500, s.suffix));

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/3 blur-[80px] animate-float" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative container mx-auto px-6 text-center">
        <div className="animate-fade-up">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border border-primary/30 text-primary mb-8">
            Production Automation Software
          </span>
        </div>

        <h1 className="animate-fade-up-delay-1 text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight max-w-5xl mx-auto mb-6">
          Automate Your{" "}
          <span className="text-gradient">Sublimation</span>{" "}
          Print Workflow
        </h1>

        <p className="animate-fade-up-delay-2 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Process hundreds of files instantly with automated resizing, renaming and export.
          Built for high-volume jersey printing manufacturers.
        </p>

        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#pricing"
            className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all glow-md animate-pulse-glow"
          >
            👉 Start 7-Day Free Trial
          </a>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-xl border border-border text-foreground font-semibold text-lg hover:bg-secondary transition-colors"
          >
            See How It Works
          </a>
        </div>

        {/* Animated Stats */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-up-delay-3">
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
  );
};

export default HeroSection;
