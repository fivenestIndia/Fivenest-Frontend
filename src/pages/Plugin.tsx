import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, CheckCircle2, Zap, FileType2, Cpu, ArrowRight, ShieldCheck, Key, ShoppingCart, Sparkles, FileCode } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const scripts = [
  { name: "Front.jsx", desc: "Front panel automation script with SIZE & Quantity text replacement + Size Map scaling", size: "4.3 KB" },
  { name: "Back.jsx", desc: "Back panel script for Player Name, Number & Size resizing", size: "7.5 KB" },
  { name: "Half_Sleeve.jsx", desc: "Sleeve panel scaling script", size: "3.2 KB" },
  { name: "Full_Sleeve.jsx", desc: "Full sleeve panel scaling script", size: "3.5 KB" },
];

const formats = [
  { ext: "PSD", desc: "Layered source" },
  { ext: "PNG", desc: "Web preview" },
  { ext: "TIFF", desc: "Print master" },
  { ext: "PDF", desc: "Client proof" },
];

export default function Plugin() {
  const [email, setEmail] = useState("");
  const [purchasedKey, setPurchasedKey] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  function handleBuyLicense(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return alert("Please enter your email address to receive your license key!");
    setIsProcessing(true);

    // Simulate Razorpay / Backend checkout verification
    setTimeout(() => {
      setIsProcessing(false);
      const generatedKey = `FN-LIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      setPurchasedKey(generatedKey);
    }, 1500);
  }

  function handleDownloadScript(scriptName: string) {
    const sampleScriptContent = `/* Fivenest Automation Script - ${scriptName} */\n#target photoshop\n\nalert("Fivenest Plugin: Processing ${scriptName}...");`;
    const blob = new Blob([sampleScriptContent], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = scriptName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <Navbar />

      <div className="relative container mx-auto px-6 pt-32 pb-20">

        {/* ── Page Header ── */}
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground uppercase tracking-widest mb-4">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            Step 4 of 4 — Plugin Studio
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Photoshop <span className="text-gradient">Plugin Studio</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Buy plugin license keys, download automation scripts (Front, Back, Sleeves), and generate 1000+ print-ready files automatically in Photoshop.
          </p>
        </div>

        {/* ── PLUGIN BUY / LICENSE PURCHASE BOX ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">

          {/* Left: Plugin Preview & Mockup UI */}
          <div className="glass-card rounded-3xl border border-primary/30 p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-surface/80 to-surface/40">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="inline-block px-3 py-1 rounded-full glass text-xs font-semibold text-primary mb-4 border border-primary/30">
                🔌 Photoshop Panel v2.0
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-3">
                Fivenest Photoshop <span className="text-gradient">Automation Engine</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Automates CSV reading, SIZE layer text replacement, automatic size map scaling (Sizes 18 to 60), and 300 DPI high-res export.
              </p>

              {/* Feature Checklist */}
              <div className="space-y-2.5 mb-6">
                {[
                  "Reads CSV data (label, size, quantity)",
                  "Automatic SIZE & quantity text layer replacement",
                  "Master Size Map scaling (Sizes 18 to 60 in inches)",
                  "Works with Photoshop CC 2021–2026 (Win & Mac)",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Script Quick Download Grid */}
            <div className="pt-4 border-t border-border/20">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-primary" /> Download Script Files (.jsx)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {scripts.map((sc) => (
                  <button
                    key={sc.name}
                    onClick={() => handleDownloadScript(sc.name)}
                    className="flex items-center justify-between p-2 rounded-xl glass-card border border-border/30 hover:border-primary/40 text-xs text-left transition-colors"
                  >
                    <div>
                      <div className="font-mono font-bold text-foreground">{sc.name}</div>
                      <div className="text-[10px] text-muted-foreground">{sc.size}</div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-primary shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Buy License Box (Razorpay / Instant Key) */}
          <div className="glass-card rounded-3xl border border-primary/30 p-8 flex flex-col justify-between relative">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Instant License Activation
                </span>
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-black text-xs border border-primary/30">
                  ₹50 / License Key
                </span>
              </div>

              <h3 className="text-2xl font-black text-foreground">Buy Photoshop Plugin License</h3>
              <p className="text-xs text-muted-foreground">
                Enter your email address below to purchase & instantly generate your Photoshop Plugin Activation License Key.
              </p>

              {!purchasedKey ? (
                <form onSubmit={handleBuyLicense} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. manufacturer@fivenest.in"
                      className="w-full px-4 py-3 rounded-xl bg-surface/60 border border-border/40 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 transition-all glow-md flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>Connecting to Razorpay...</>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" /> BUY LICENSE - ₹50
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Sparkles className="w-4 h-4" /> License Activation Success! 🎉
                  </div>
                  <div className="text-xs text-muted-foreground">Your Photoshop Plugin License Key:</div>
                  <div className="p-3 rounded-xl bg-surface border border-emerald-500/40 text-center font-mono text-base font-black tracking-wider text-emerald-400 select-all">
                    {purchasedKey}
                  </div>
                  <div className="text-[11px] text-muted-foreground text-center">
                    Copy and paste this key into your Photoshop Fivenest Plugin Panel.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /> Instant Delivery</span>
              <span>24/7 Whatsapp Support</span>
            </div>
          </div>

        </div>

        {/* ── Output file formats ── */}
        <div className="glass-card rounded-2xl border border-border/30 p-8 mb-16">
          <h3 className="text-xl font-black mb-2 flex items-center gap-2">
            <FileType2 className="w-5 h-5 text-primary" /> Export File Formats
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

        {/* ── Final Workflow Complete Banner ── */}
        <div className="relative rounded-3xl glass border border-primary/20 p-8 md:p-12 text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
          <div className="relative">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Complete Print Factory <span className="text-gradient">Workflow!</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              From design selection to order recording, data resizing, and automated file output — all connected.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/design-hub"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all glow-md"
              >
                Start New Order <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/production"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-border font-semibold hover:bg-secondary transition-colors"
              >
                Open Production Resizer
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
