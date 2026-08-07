import { useEffect, useRef, useState } from "react";

const plans = [
  {
    name: "Starter",
    desc: "For small units handling up to 300 files/day",
    original: "₹2,500",
    price: "₹1,750",
    period: "/ month",
    features: ["Bulk CSV Import", "Auto Resize to Exact Inches", "Auto Rename by Order ID", "Print-Ready 300 DPI Export"],
    popular: false,
  },
  {
    name: "Pro",
    desc: "For growing production units",
    original: "₹3,000",
    price: "₹2,000",
    period: "/ month",
    features: ["Unlimited files", "Advanced naming logic", "Faster processing", "Priority support"],
    popular: true,
  },
  {
    name: "Premium",
    desc: "For enterprise scale production",
    original: "₹4,000",
    price: "₹2,500",
    period: "/ month",
    features: ["Unlimited files", "Multi-device logic", "Custom integrations", "Premium Support"],
    popular: false,
  },
  {
    name: "Enterprise",
    desc: "For factories with custom needs",
    original: "₹6,000",
    price: "₹4,000",
    period: "/ month",
    features: ["Everything in Premium", "Dedicated account manager", "Custom plugin development", "On-site training"],
    popular: false,
  },
];

const PricingSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="pricing" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Select Your <span className="text-gradient">Production Capacity</span>
          </h2>
          <p className="text-muted-foreground text-lg">Transparent pricing for manufacturing units of all sizes</p>
        </div>

        <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative glass-card rounded-2xl p-6 flex flex-col transition-all duration-500 hover:-translate-y-2 ${
                plan.popular ? "border-primary/40 glow-sm" : ""
              } ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>

              <div className="mb-6">
                <span className="text-sm text-muted-foreground line-through mr-2">{plan.original}</span>
                <span className="text-3xl font-black text-gradient">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-primary">✓</span>
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="https://www.fivenest.in/#pricing"
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:opacity-90 glow-sm"
                    : "border border-border hover:bg-secondary"
                }`}
              >
                Get Started Now
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
