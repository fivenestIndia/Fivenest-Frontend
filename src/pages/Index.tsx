import { Link } from "react-router-dom";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import {
  Palette, ClipboardList, Layers, Cpu,
  ArrowRight, CheckCircle2, Zap, Clock, TrendingUp, ShieldCheck
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: <Palette className="w-7 h-7" />,
    title: "Design Hub",
    subtitle: "Browse & Select a Jersey Design",
    desc: "Your customer walks in. Open the Design Hub — 500+ professional sports jerseys across Football, Cricket, Kabaddi, Esports, and more. Customer picks a design in minutes.",
    href: "/design-hub",
    cta: "Browse Designs",
    color: "from-cyan-500/20 to-blue-600/20",
    border: "border-cyan-500/30",
    badge: "Step 1 — Customer Picks",
  },
  {
    number: "02",
    icon: <ClipboardList className="w-7 h-7" />,
    title: "Order Management",
    subtitle: "Record the Order Details",
    desc: "Enter customer name, phone, sport type, sizes (XS to XXL), custom colors, price per piece, and delivery deadline. Everything saved instantly — works offline.",
    href: "/orders",
    cta: "Manage Orders",
    color: "from-violet-500/20 to-purple-600/20",
    border: "border-violet-500/30",
    badge: "Step 2 — Owner Records",
  },
  {
    number: "03",
    icon: <Layers className="w-7 h-7" />,
    title: "Production Queue",
    subtitle: "Track Every Order by Stage",
    desc: "Your production team sees all orders on a live kanban board: New → In Production → Ready → Delivered. One click to move an order forward. Never miss a deadline.",
    href: "/production",
    cta: "View Production",
    color: "from-emerald-500/20 to-teal-600/20",
    border: "border-emerald-500/30",
    badge: "Step 3 — Team Tracks",
  },
  {
    number: "04",
    icon: <Cpu className="w-7 h-7" />,
    title: "Plugin Studio",
    subtitle: "Generate Print-Ready Files in Minutes",
    desc: "Upload the jersey design PSD, paste player names and numbers from the order — the Fivenest plugin generates 50+ print-ready 300 DPI files automatically. Save 70% production time.",
    href: "/plugin",
    cta: "Open Plugin",
    color: "from-orange-500/20 to-red-600/20",
    border: "border-orange-500/30",
    badge: "Step 4 — Plugin Automates",
  },
];

const benefits = [
  { icon: <Clock className="w-5 h-5" />, title: "70% Faster", desc: "Reduce manual file prep from hours to minutes" },
  { icon: <Zap className="w-5 h-5" />, title: "1000+ Files/Run", desc: "Process entire order batches in a single click" },
  { icon: <TrendingUp className="w-5 h-5" />, title: "Zero Errors", desc: "Automated naming eliminates manual mistakes" },
  { icon: <ShieldCheck className="w-5 h-5" />, title: "Works Offline", desc: "Orders saved locally — no internet needed" },
];

const Index = () => (
  <div className="min-h-screen relative">
    <AuroraBackground />
    <Navbar />

    {/* ── Hero ─────────────────────────────────────────────── */}
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/3 blur-[80px] animate-float" />
      </div>

      <div className="relative container mx-auto px-6 text-center">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border border-primary/30 text-primary mb-8">
            <Zap className="w-3 h-3" /> Built for Jersey Printing Manufacturers — India
          </span>
        </div>

        <h1 className="animate-fade-up-delay-1 text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight max-w-5xl mx-auto mb-6">
          From Customer Walk-In{" "}
          <br className="hidden md:block" />
          to{" "}
          <span className="text-gradient">Print-Ready Files</span>
          <br className="hidden md:block" />
          in Minutes
        </h1>

        <p className="animate-fade-up-delay-2 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          A complete 4-step workflow for sublimation printing factories. Browse designs, record orders, track production, and auto-generate files — all in one place.
        </p>

        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/design-hub"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all glow-md animate-pulse-glow"
          >
            Start the Workflow <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-border text-foreground font-semibold text-lg hover:bg-secondary transition-colors"
          >
            <ClipboardList className="w-5 h-5" /> View Orders
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-up-delay-3">
          {[
            { val: "1000+", label: "Files Per Run" },
            { val: "70%", label: "Time Saved" },
            { val: "3x", label: "Faster Output" },
            { val: "0", label: "Manual Errors" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl md:text-5xl font-black text-gradient glow-text">{s.val}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Workflow Steps ─────────────────────────────────────── */}
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full glass text-xs font-semibold text-primary mb-4 border border-primary/20">
            🏭 Complete Workflow
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
            4 Steps. One{" "}
            <span className="text-gradient">Seamless System.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every step connects to the next. From customer design selection to final print-ready file — no gaps, no confusion.
          </p>
        </div>

        {/* Workflow connector line — desktop */}
        <div className="hidden lg:flex items-center justify-center mb-12 px-20">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <Link
              key={step.href}
              to={step.href}
              className="group relative rounded-2xl glass-card border border-border/40 hover:border-primary/40 p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl flex flex-col"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Gradient bg on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative flex flex-col flex-1">
                {/* Step number */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-5xl font-black text-gradient opacity-25 group-hover:opacity-60 transition-opacity">
                    {step.number}
                  </span>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-primary border ${step.border} bg-primary/10 group-hover:scale-110 transition-transform`}>
                    {step.icon}
                  </div>
                </div>

                {/* Badge */}
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-2">
                  {step.badge}
                </span>

                {/* Title */}
                <h3 className="text-xl font-black mb-1 text-foreground">{step.title}</h3>
                <p className="text-sm font-semibold text-muted-foreground mb-3">{step.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{step.desc}</p>

                {/* CTA */}
                <div className="mt-5 flex items-center gap-2 text-primary text-sm font-semibold group-hover:gap-3 transition-all">
                  {step.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* ── Benefits ───────────────────────────────────────────── */}
    <section className="py-16 relative">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {benefits.map((b) => (
            <div key={b.title} className="glass-card rounded-2xl p-5 border border-border/30 flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                {b.icon}
              </div>
              <div>
                <div className="font-bold text-foreground text-sm">{b.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA Banner ─────────────────────────────────────────── */}
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="relative rounded-3xl glass border border-primary/20 p-10 md:p-16 text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              Ready to Automate Your <span className="text-gradient">Print Factory?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              Start with the Design Hub — let your customer choose a jersey design right now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/design-hub"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all glow-md"
              >
                <Palette className="w-5 h-5" /> Open Design Hub
              </Link>
              <Link
                to="/orders"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-border font-semibold text-lg hover:bg-secondary transition-colors"
              >
                <ClipboardList className="w-5 h-5" /> New Order
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Works Offline</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> No Setup Required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Free to Start</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Footer />
    <WhatsAppButton />
  </div>
);

export default Index;
