import { Link } from "react-router-dom";
import { Download, CheckCircle2, Zap, FileType2, Cpu, ArrowRight, Users, Clock, Layers } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const steps = [
  {
    number: "01",
    title: "Install the Plugin",
    desc: "Download and install the Fivenest Photoshop plugin. One-time setup — works on Windows and Mac. Compatible with Photoshop CC 2021 and above.",
  },
  {
    number: "02",
    title: "Open Design + Enter Order Data",
    desc: "Open your jersey PSD from the Design Hub. In the Plugin panel, paste player names and numbers from your order sheet. Supports up to 100 players per batch.",
  },
  {
    number: "03",
    title: "Click Generate — Done",
    desc: "The plugin processes every player automatically. Exports 300 DPI print-ready files with correct naming — ready for your RIP software or direct-to-printer.",
  },
];

const formats = [
  { ext: "PSD", desc: "Layered source" },
  { ext: "PNG", desc: "Web preview" },
  { ext: "TIFF", desc: "Print master" },
  { ext: "PDF", desc: "Client proof" },
];

const stats = [
  { val: "1000+", label: "Files per run" },
  { val: "70%", label: "Time saved" },
  { val: "3x", label: "Faster output" },
  { val: "100%", label: "Print accurate" },
];

export default function Plugin() {
  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <Navbar />

      <div className="relative container mx-auto px-6 pt-32 pb-20">

        {/* ── Page header ── */}
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground uppercase tracking-widest mb-4">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            Step 4 of 4
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Plugin <span className="text-gradient">Studio</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Install the Fivenest Photoshop plugin once. Then generate complete print-ready jersey files from any order in minutes — not hours.
          </p>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl border border-border/30 p-5 text-center">
              <div className="text-3xl font-black text-gradient glow-text">{s.val}</div>
              <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Download card ── */}
        <div className="relative rounded-3xl glass border border-primary/20 p-8 md:p-12 mb-16 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-block px-4 py-1.5 rounded-full glass text-xs font-semibold text-primary mb-4 border border-primary/30">
                🔌 Fivenest Plugin v2.1 — Free with Subscription
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-3">
                Download the <span className="text-gradient">Photoshop Plugin</span>
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Works with Adobe Photoshop CC 2021–2026. One-click install. Process any jersey order batch in under 5 minutes — full names, numbers, sizes, file naming.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all glow-md"
                >
                  <Download className="w-4 h-4" /> Download Plugin
                </a>
                <a
                  href="https://www.fivenest.in/#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-border font-semibold hover:bg-secondary transition-colors"
                >
                  Watch Demo
                </a>
              </div>
            </div>

            {/* Compatibility badges */}
            <div className="glass-card rounded-2xl border border-border/30 p-6 min-w-[200px]">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Compatible With</div>
              <div className="space-y-2">
                {["Photoshop CC 2021+", "Windows 10/11", "macOS 11+", "Intel & Apple Silicon"].map((c) => (
                  <div key={c} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 rounded-full glass text-xs font-semibold text-primary mb-4 border border-primary/20">
              🚀 3 Steps to Print-Ready Files
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              How the <span className="text-gradient">Plugin Works</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={step.number} className="relative glass-card rounded-2xl border border-border/30 p-6 hover:border-primary/30 transition-all group">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(100%+0px)] w-6 h-px bg-gradient-to-r from-primary/40 to-transparent z-10" />
                )}
                <div className="text-5xl font-black text-gradient opacity-20 group-hover:opacity-50 transition-opacity mb-4">{step.number}</div>
                <h3 className="text-lg font-black mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Output formats ── */}
        <div className="glass-card rounded-2xl border border-border/30 p-8 mb-16">
          <h3 className="text-xl font-black mb-2 flex items-center gap-2">
            <FileType2 className="w-5 h-5 text-primary" /> Output File Formats
          </h3>
          <p className="text-muted-foreground text-sm mb-6">The plugin exports in all formats your RIP software or print shop needs.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {formats.map((f) => (
              <div key={f.ext} className="rounded-xl bg-surface/50 border border-border/30 p-4 text-center hover:border-primary/30 transition-colors">
                <div className="text-xl font-black text-gradient mb-1">.{f.ext}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Features list ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {[
            { icon: <Zap />, title: "Batch Processing", desc: "Process 100 jerseys in under 3 minutes" },
            { icon: <Users />, title: "Player Data Import", desc: "Paste names & numbers from Excel or Google Sheets" },
            { icon: <CheckCircle2 />, title: "Smart File Naming", desc: "Auto-name files: Player_Name_Size_Number" },
            { icon: <FileType2 />, title: "300 DPI Export", desc: "Print-ready resolution for sublimation & screen print" },
            { icon: <Clock />, title: "Save 70% Time", desc: "What takes 4 hours now takes 20 minutes" },
            { icon: <Layers />, title: "Layer Smart", desc: "Works with any layered jersey PSD template" },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-xl border border-border/30 p-5 flex items-start gap-4 hover:border-primary/30 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform [&>svg]:w-4 [&>svg]:h-4">
                {f.icon}
              </div>
              <div>
                <div className="font-bold text-sm mb-0.5">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Workflow complete CTA ── */}
        <div className="relative rounded-3xl glass border border-primary/20 p-8 md:p-12 text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
          <div className="relative">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Workflow <span className="text-gradient">Complete!</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              Customer walked in. Design chosen. Order recorded. Files generated. All in under 10 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/design-hub"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all glow-md"
              >
                Start New Customer <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/production"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-border font-semibold hover:bg-secondary transition-colors"
              >
                <Layers className="w-4 h-4" /> View Production Queue
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
