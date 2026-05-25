import { useEffect, useRef, useState } from "react";

const features = [
  "Bulk CSV Import",
  "Auto Resize to Exact Inches",
  "Auto Rename by Order ID",
  "Print-Ready 300 DPI Export",
  "Unlimited Files",
  "Advanced Naming Logic",
  "Faster Processing",
  "Multi-Device Logic",
  "Custom Integrations",
  "Priority Support",
  "Dedicated Account Manager",
  "Custom Plugin Development",
  "On-site Training",
];

const plans = [
  { name: "Starter", checks: [true, true, true, true, false, false, false, false, false, false, false, false, false] },
  { name: "Pro", checks: [true, true, true, true, true, true, true, false, false, true, false, false, false] },
  { name: "Premium", checks: [true, true, true, true, true, true, true, true, true, true, false, false, false] },
  { name: "Enterprise", checks: [true, true, true, true, true, true, true, true, true, true, true, true, true] },
];

const ComparisonTable = () => {
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
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Compare <span className="text-gradient">Plans</span>
          </h2>
        </div>

        <div
          ref={ref}
          className={`max-w-5xl mx-auto overflow-x-auto transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-3 text-sm font-semibold text-muted-foreground">Feature</th>
                {plans.map((p) => (
                  <th key={p.name} className="py-4 px-3 text-sm font-bold text-center">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, fi) => (
                <tr key={feature} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-3 text-sm text-muted-foreground">{feature}</td>
                  {plans.map((p) => (
                    <td key={p.name} className="py-3 px-3 text-center">
                      {p.checks[fi] ? (
                        <span className="text-primary font-bold">✓</span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
