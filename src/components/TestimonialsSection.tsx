import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Owner, RK Sports Manufacturing",
    quote: "Fivenest cut our file preparation time from 3 hours to 15 minutes. We now process 500+ jerseys daily without any errors.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Production Manager, PrintMax India",
    quote: "The CSV import feature alone saved us from hiring two more data entry operators. ROI was immediate.",
    rating: 5,
  },
  {
    name: "Amit Patel",
    role: "Founder, Gujarat Sublimation Works",
    quote: "We had 5-10 misprints daily due to manual naming errors. With Fivenest, we've had zero misprints in 3 months.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
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
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Trusted by <span className="text-gradient">Manufacturers</span>
          </h2>
          <p className="text-muted-foreground text-lg">See what production units across India are saying</p>
        </div>

        <div ref={ref} className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`glass-card rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} className="text-warning text-lg">★</span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">"{t.quote}"</p>
              <div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
