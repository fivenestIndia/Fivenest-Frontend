import { useEffect, useRef, useState } from "react";

const steps = [
  { icon: "📂", title: "Upload CSV", desc: "Import your daily order sheet containing names, sizes, and design variables." },
  { icon: "⚙️", title: "Processing Engine", desc: "Fivenest reads the data, grabs the master file, and applies pixel-perfect transformations." },
  { icon: "🖼️", title: "Batch Export", desc: "Generates hundreds of high-res files instantly without freezing your computer." },
  { icon: "✅", title: "Print Ready", desc: "Files are perfectly named, sized, and ready to send straight to the printer." },
];

const HowItWorksSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="py-32 relative">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Automation in <span className="text-gradient">Action</span>
          </h2>
          <p className="text-muted-foreground text-lg">Four simple steps to production-ready files</p>
        </div>

        <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`glass-card rounded-2xl p-6 text-center group hover:glow-sm transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{step.icon}</div>
              <div className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Step {i + 1}</div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
