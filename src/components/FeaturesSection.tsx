import { useEffect, useRef, useState } from "react";
import { Zap, FileSpreadsheet, Maximize2, Tag, Printer, Layers } from "lucide-react";

const useInView = (threshold = 0.15) => {
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

const FeaturesSection = () => {
  const { ref, inView } = useInView();

  return (
    <section id="features" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full glass text-xs font-semibold text-primary mb-4">
            ⚡ Built for Production Floors
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            Everything You Need to <br />
            <span className="text-gradient">Automate Jersey Printing</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Replace 8 hours of manual work with a single click. Built for Photoshop, trusted by India's top sportswear factories.
          </p>
        </div>

        <div
          ref={ref}
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Big card - Bulk CSV */}
          <div className="md:col-span-2 md:row-span-2 glass-card rounded-3xl p-8 group hover:border-primary/40 transition-all relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <FileSpreadsheet className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Bulk CSV Import</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Upload one CSV with hundreds of orders. Fivenest reads names, numbers, sizes & generates every print-ready file automatically.
              </p>
              {/* Mini mockup */}
              <div className="glass rounded-xl p-4 font-mono text-xs space-y-1.5 max-w-sm">
                <div className="flex justify-between text-muted-foreground border-b border-border/50 pb-1.5">
                  <span>order.csv</span>
                  <span className="text-primary">324 rows</span>
                </div>
                <div className="flex justify-between"><span className="text-foreground">SHARMA</span><span className="text-muted-foreground">10 · L</span></div>
                <div className="flex justify-between"><span className="text-foreground">VERMA</span><span className="text-muted-foreground">07 · M</span></div>
                <div className="flex justify-between"><span className="text-foreground">SINGH</span><span className="text-muted-foreground">23 · XL</span></div>
                <div className="text-primary text-center pt-1">+ 321 more →</div>
              </div>
            </div>
          </div>

          {/* Auto Resize */}
          <div className="glass-card rounded-3xl p-6 group hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Maximize2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Auto Resize</h3>
            <p className="text-sm text-muted-foreground">Pixel-perfect resizing to exact print inches. Every. Single. Time.</p>
          </div>

          {/* Smart Rename */}
          <div className="glass-card rounded-3xl p-6 group hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Tag className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Rename</h3>
            <p className="text-sm text-muted-foreground">Auto-rename by Order ID, Player Name, or any custom logic.</p>
          </div>

          {/* Lightning Speed */}
          <div className="glass-card rounded-3xl p-6 group hover:border-primary/40 transition-all relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">40x Faster</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gradient">3 min</span>
                <span className="text-sm text-muted-foreground line-through">vs 2 hrs</span>
              </div>
            </div>
          </div>

          {/* Print-Ready */}
          <div className="glass-card rounded-3xl p-6 group hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Printer className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">300 DPI Export</h3>
            <p className="text-sm text-muted-foreground">Print-ready output. CMYK, sublimation, DTG — all supported.</p>
          </div>

          {/* Layers */}
          <div className="md:col-span-2 glass-card rounded-3xl p-8 group hover:border-primary/40 transition-all relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
            <div className="relative flex items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Layers className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Works Inside Photoshop</h3>
                <p className="text-muted-foreground">
                  Native PSD plugin — no separate software. Install once, runs forever. Compatible with Photoshop CC 2018 to 2024.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
