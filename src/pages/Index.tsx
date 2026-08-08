import { Link } from "react-router-dom";
import { ArrowRight, Palette, ClipboardList, Layers, Cpu } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustBadges from "@/components/TrustBadges";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ROICalculator from "@/components/ROICalculator";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import ComparisonTable from "@/components/ComparisonTable";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AuroraBackground from "@/components/AuroraBackground";

/* ── Workflow intro steps ─────────────────────────────────── */
const steps = [
  {
    number: "01",
    icon: <Palette className="w-6 h-6" />,
    title: "Design Hub",
    subtitle: "Customer picks a jersey design",
    desc: "500+ professional sports jersey designs. Customer browses, picks one in minutes — PSD, AI, CDR ready for sublimation.",
    href: "/design-hub",
    cta: "Browse Designs",
    accent: "from-cyan-500/20 to-blue-500/20",
    border: "hover:border-cyan-500/40",
  },
  {
    number: "02",
    icon: <ClipboardList className="w-6 h-6" />,
    title: "Order Management",
    subtitle: "Record every order detail",
    desc: "Enter customer name, sport, sizes (XS–XXL), price, deadline. Everything stored locally — works offline on the factory floor.",
    href: "/orders",
    cta: "New Order",
    accent: "from-violet-500/20 to-purple-500/20",
    border: "hover:border-violet-500/40",
  },
  {
    number: "03",
    icon: <Layers className="w-6 h-6" />,
    title: "Production Queue",
    subtitle: "Track orders through production",
    desc: "Kanban board: New → In Production → Ready → Delivered. One click to advance any order. Never miss a deadline.",
    href: "/production",
    cta: "View Queue",
    accent: "from-emerald-500/20 to-teal-500/20",
    border: "hover:border-emerald-500/40",
  },
  {
    number: "04",
    icon: <Cpu className="w-6 h-6" />,
    title: "Plugin Studio",
    subtitle: "Auto-generate print-ready files",
    desc: "Upload PSD + paste player names & numbers. Plugin generates 1000+ print-ready 300 DPI files in minutes. Save 70% time.",
    href: "/plugin",
    cta: "Open Plugin",
    accent: "from-orange-500/20 to-red-500/20",
    border: "hover:border-orange-500/40",
  },
];

/* ── Workflow Intro Section component ─────────────────────── */
const WorkflowIntro = () => (
  <section id="workflow" className="py-28 relative">
    <div className="container mx-auto px-6">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-block px-4 py-1.5 rounded-full glass text-xs font-semibold text-primary mb-5 border border-primary/20 tracking-widest uppercase">
          🏭 Complete Print Factory Workflow
        </div>
        <h2 className="text-4xl md:text-6xl font-black mb-5 tracking-tight">
          From Customer Walk-In to{" "}
          <span className="text-gradient">Print-Ready Files</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          A seamless 4-step system built for jersey printing manufacturers. Every step connects to the next — no gaps, no confusion.
        </p>
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {steps.map((step, i) => (
          <Link
            key={step.href}
            to={step.href}
            className={`group relative rounded-2xl glass-card border border-border/30 ${step.border} p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl flex flex-col`}
          >
            {/* Hover gradient bg */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            <div className="relative flex flex-col flex-1">
              {/* Number + Icon */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-5xl font-black text-gradient opacity-20 group-hover:opacity-50 transition-opacity">
                  {step.number}
                </span>
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
              </div>

              <h3 className="text-lg font-black mb-1">{step.title}</h3>
              <p className="text-xs font-semibold text-primary/70 mb-3">{step.subtitle}</p>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{step.desc}</p>

              <div className="mt-5 flex items-center gap-1.5 text-primary text-sm font-semibold group-hover:gap-2.5 transition-all">
                {step.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Connector arrow between cards — desktop only */}
            {i < steps.length - 1 && (
              <div className="hidden xl:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-primary/20 border border-primary/30 items-center justify-center">
                <ArrowRight className="w-3 h-3 text-primary" />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  </section>
);

/* ── Main Index page — original + workflow intro ─────────── */
const Index = () => (
  <div className="min-h-screen relative">
    <AuroraBackground />
    <Navbar />
    <HeroSection />
    <TrustBadges />
    {/* ── NEW: Workflow Introduction ── */}
    <WorkflowIntro />
    <FeaturesSection />
    <HowItWorksSection />
    <ROICalculator />
    <TestimonialsSection />
    <PricingSection />
    <ComparisonTable />
    <FAQSection />
    <Footer />
    <WhatsAppButton />
  </div>
);

export default Index;
