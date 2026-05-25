import { useMemo, useState, useEffect, useRef } from "react";
import { TrendingUp, Clock, IndianRupee, Zap } from "lucide-react";

const ROICalculator = () => {
  const [files, setFiles] = useState(150);
  const [hourlyCost, setHourlyCost] = useState(150);
  const [days, setDays] = useState(26);

  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const result = useMemo(() => {
    // Manual: ~1.5 min per file. Fivenest: ~0.6 sec per file.
    const manualMinPerDay = files * 1.5;
    const fivenestMinPerDay = files * 0.01;
    const minutesSavedPerDay = manualMinPerDay - fivenestMinPerDay;
    const hoursSavedPerMonth = (minutesSavedPerDay * days) / 60;
    const moneySavedPerMonth = Math.round(hoursSavedPerMonth * hourlyCost);
    const moneySavedPerYear = moneySavedPerMonth * 12;
    const planCost = 2000;
    const roi = Math.round(((moneySavedPerMonth - planCost) / planCost) * 100);
    return {
      hoursSavedPerMonth: Math.round(hoursSavedPerMonth),
      moneySavedPerMonth,
      moneySavedPerYear,
      roi: Math.max(roi, 0),
    };
  }, [files, hourlyCost, days]);

  return (
    <section id="roi" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full glass text-xs font-semibold text-primary mb-4">
            🧮 ROI Calculator
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            See How Much You'll <span className="text-gradient">Save</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Adjust the sliders to match your factory's workload. See your real savings instantly.
          </p>
        </div>

        <div
          ref={ref}
          className={`grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Inputs */}
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-8">Your Production Numbers</h3>

            <div className="space-y-8">
              <SliderInput
                label="Files printed per day"
                value={files}
                onChange={setFiles}
                min={20}
                max={1000}
                step={10}
                suffix="files"
              />
              <SliderInput
                label="Operator cost per hour"
                value={hourlyCost}
                onChange={setHourlyCost}
                min={50}
                max={500}
                step={10}
                prefix="₹"
              />
              <SliderInput
                label="Working days per month"
                value={days}
                onChange={setDays}
                min={20}
                max={30}
                step={1}
                suffix="days"
              />
            </div>
          </div>

          {/* Results */}
          <div className="glass-card rounded-3xl p-8 relative overflow-hidden border-primary/30 glow-sm">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
            <div className="relative">
              <h3 className="text-xl font-bold mb-8">Your Monthly Savings</h3>

              <div className="space-y-4">
                <ResultCard
                  icon={<Clock className="w-5 h-5" />}
                  label="Time saved / month"
                  value={`${result.hoursSavedPerMonth} hrs`}
                />
                <ResultCard
                  icon={<IndianRupee className="w-5 h-5" />}
                  label="Money saved / month"
                  value={`₹${result.moneySavedPerMonth.toLocaleString("en-IN")}`}
                  highlight
                />
                <ResultCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Money saved / year"
                  value={`₹${result.moneySavedPerYear.toLocaleString("en-IN")}`}
                />
                <ResultCard
                  icon={<Zap className="w-5 h-5" />}
                  label="ROI on Pro plan"
                  value={`${result.roi}%`}
                />
              </div>

              <a
                href="#pricing"
                className="block w-full text-center mt-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity glow-sm"
              >
                Start Saving Today →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SliderInput = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
}) => (
  <div>
    <div className="flex justify-between items-baseline mb-3">
      <label className="text-sm text-muted-foreground">{label}</label>
      <span className="text-2xl font-bold text-gradient">
        {prefix}
        {value.toLocaleString("en-IN")} {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
    />
  </div>
);

const ResultCard = ({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={`flex items-center justify-between p-4 rounded-xl ${
      highlight ? "bg-primary/10 border border-primary/30" : "bg-secondary/40"
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${highlight ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
        {icon}
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <span className={`font-black ${highlight ? "text-2xl text-gradient" : "text-xl"}`}>{value}</span>
  </div>
);

export default ROICalculator;
