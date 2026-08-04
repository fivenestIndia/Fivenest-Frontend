import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  X,
  Layers,
  Zap,
  Cpu,
  FileSpreadsheet,
  Maximize2,
  Box,
  Key,
  HelpCircle,
  Download,
  Laptop,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

// Plugin subscription plans matching backend server config (server/config/plans.js)
const pluginPlans = [
  {
    planId: "starter",
    name: "Starter Plugin License",
    desc: "For small print shops & single designer setup",
    original: "₹2,500",
    price: "₹1,750",
    numericPrice: 1750,
    period: "/ month",
    devices: "1 Device Allowed",
    features: [
      "Photoshop & CorelDraw CEP Panels",
      "Bulk CSV Roster Auto-Generation",
      "Auto Inch Size Grading (S to 7XL)",
      "Print-Ready 300 DPI Export",
      "Standard Email Activation Support",
    ],
    popular: false,
    badge: "1 Device"
  },
  {
    planId: "pro",
    name: "Pro Plugin License",
    desc: "For growing sublimation factories (2 Workstations)",
    original: "₹3,500",
    price: "₹2,000",
    numericPrice: 2000,
    period: "/ month",
    devices: "2 Devices Allowed",
    features: [
      "Everything in Starter Plan",
      "2 Concurrent PC / Device Activations",
      "AI Roster Image Reader (OCR Notes)",
      "Custom Size Grading Database",
      "Fast Multi-Core Render Export Speed",
    ],
    popular: true,
    badge: "Most Popular"
  },
  {
    planId: "premium",
    name: "Premium Plugin License",
    desc: "For multi-line manufacturing units (5 Workstations)",
    original: "₹7,500",
    price: "₹5,000",
    numericPrice: 5000,
    period: "/ month",
    devices: "5 Devices Allowed",
    features: [
      "Everything in Pro Plan",
      "5 Concurrent PC / Device Activations",
      "Multi-Device Hardware Key Sync",
      "Full PSD / CDR Template Library Access",
      "Priority WhatsApp Key Reset Support",
    ],
    popular: false,
    badge: "5 Devices"
  },
  {
    planId: "enterprise",
    name: "Enterprise Plugin License",
    desc: "For high-volume factories & automated workflows (10 Workstations)",
    original: "₹15,000",
    price: "₹10,000",
    numericPrice: 10000,
    period: "/ month",
    devices: "10 Devices Allowed",
    features: [
      "Everything in Premium Plan",
      "10 Concurrent PC / Device Activations",
      "Custom ExtendScript / JSX Automation",
      "Unlimited PSD Panel Export Runs",
      "24/7 Dedicated Account Manager",
    ],
    popular: false,
    badge: "10 Devices"
  },
];

const pluginCapabilities = [
  {
    icon: FileSpreadsheet,
    title: "1. Bulk CSV Roster Automation",
    description: "Import Excel or CSV lists of player names, numbers, sizes, and sponsor logos. The plugin automatically populates all jersey layers in seconds without manual copy-paste."
  },
  {
    icon: Maximize2,
    title: "2. Auto Inch Size Grading",
    description: "Automatically scale chest width, height, sleeve length, and collar measurements across all standard sizes (Small to 7XL) using exact manufacturer inch patterns."
  },
  {
    icon: Box,
    title: "3. 3D Live Jersey Mockups",
    description: "Preview your final sublimation pattern in 3D directly inside Photoshop before sending to print, eliminating artwork misalignments and costly fabric waste."
  },
  {
    icon: Cpu,
    title: "4. High-Speed 300 DPI Export",
    description: "Export ultra-crisp, print-ready PDF, TIFF, or PSD files with automatic bleed lines, cut marks, and custom file naming rules for direct RIP software printing."
  }
];

const activationSteps = [
  {
    step: "01",
    title: "Purchase Plugin License",
    description: "Choose a plan (Starter, Pro, Premium, Enterprise) and complete payment. Your unique activation key (e.g. FN-A1B2-C3D4-E5F6) will be generated instantly and sent to your email."
  },
  {
    step: "02",
    title: "Install Extension Panel",
    description: "Copy the plugin folder into your Photoshop CEP extensions folder (C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions\\) and restart Photoshop."
  },
  {
    step: "03",
    title: "Open Extension Panel",
    description: "Inside Photoshop or CorelDraw, navigate to Window -> Extensions -> FN Plugin. The panel will launch directly on your workplace screen."
  },
  {
    step: "04",
    title: "Enter Email & License Key",
    description: "Enter your registered Email address and Activation Key into the panel input fields, then click 'Activate License'. The plugin binds your device HWID and unlocks all features!"
  }
];

const Plugins = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const openCheckout = (plan: any) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone) return alert("Please enter your email and phone number.");
    setIsLoading(true);

    try {
      const DEFAULT_API_URL = "https://fivenest-backend.onrender.com";
      const API_BASE_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith("http"))
        ? import.meta.env.VITE_API_URL
        : DEFAULT_API_URL;
      const RENDER_API_URL = `${API_BASE_URL}/api/payment/create-link`;

      const response = await fetch(RENDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedPlan.numericPrice,
          email: email.trim(),
          phone: phone.trim(),
          planName: selectedPlan.name,
          planId: selectedPlan.planId,
          returnUrl: `${window.location.origin}/plugins`,
        }),
      });

      const resText = await response.text();
      let data: any = {};
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch (err) {
        throw new Error(`Server error (${response.status}). Please try again.`);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to generate payment link. Please try again.");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Payment Link Error:", error);
      alert("Server is currently busy. Please try again in a moment.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-slate-950 text-white selection:bg-cyan-500 selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6 inline-flex items-center gap-2">
              <Sparkles size={14} /> FiveNest Desktop Plugins & Extensions
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
              Photoshop, CorelDraw & Illustrator{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                Plugin Suite
              </span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-normal leading-relaxed">
              Automate jersey layout production inside Adobe Photoshop & CorelDraw. Generate player rosters, auto-grade sizes in inches, and export print-ready files automatically.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#pricing"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-extrabold text-sm shadow-xl shadow-cyan-500/25 hover:opacity-95 transition-all flex items-center gap-2"
              >
                <span>Get Plugin License Key</span>
                <ArrowRight size={16} />
              </a>
              <a
                href="#how-activation-works"
                className="px-8 py-4 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center gap-2"
              >
                <Key size={16} className="text-cyan-400" />
                <span>How Activation Keys Work</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Capabilities Breakdown */}
      <section className="py-16 md:py-24 bg-slate-900/40 border-y border-slate-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-white mb-3">What FiveNest Plugins Do</h2>
            <p className="text-slate-400 text-sm md:text-base">
              Designed specifically for sublimation sportswear manufacturers, printing units, and graphic designers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {pluginCapabilities.map((cap, idx) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5">
                    <cap.icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{cap.title}</h3>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{cap.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Step-by-Step Activation Instructions */}
      <section id="how-activation-works" className="py-20 md:py-28 relative">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3 inline-block">
              🔐 Key Activation Guide
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              How to Activate Your Plugin License
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
              Follow these simple steps to activate your FiveNest Photoshop & CorelDraw plugin panel on your PC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {activationSteps.map((stepItem, i) => (
              <motion.div
                key={stepItem.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 relative flex items-start gap-4"
              >
                <div className="text-3xl font-black text-cyan-400/40 flex-shrink-0">
                  {stepItem.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    {stepItem.title}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    {stepItem.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Activation Troubleshooting Box */}
          <div className="p-6 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-4">
            <AlertCircle size={24} className="text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-extrabold text-cyan-300 mb-1">Having trouble activating your key?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                If your plugin displays <em>"License key not found"</em> or <em>"Device limit exceeded"</em>, make sure you enter the exact email address used during purchase. To reset your device HWID bindings or transfer keys to a new PC, contact our 24/7 WhatsApp support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plugin Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 relative overflow-hidden bg-slate-950">
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block">
              💳 Plugin Subscription Plans
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
              FiveNest <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Plugin License Keys</span>
            </h2>
            <p className="text-slate-400 text-base md:text-lg">
              Get instant activation keys delivered straight to your email upon payment.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
            {pluginPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -6 }}
                className={`relative rounded-3xl p-6 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 ${
                  plan.popular
                    ? "bg-slate-900/90 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/20"
                    : "bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-xs font-extrabold shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles size={12} />
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    {!plan.popular && (
                      <span className="text-[10px] font-extrabold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-6 min-h-[32px]">{plan.desc}</p>

                  <div className="mb-6 pb-6 border-b border-slate-800">
                    <span className="text-xs text-slate-500 line-through mr-2 font-semibold">{plan.original}</span>
                    <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-400 font-medium ml-1">{plan.period}</span>
                    <div className="mt-1 text-xs font-semibold text-cyan-400 flex items-center gap-1">
                      <Laptop size={12} /> {plan.devices}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openCheckout(plan)}
                  className={`w-full py-3.5 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black shadow-lg shadow-cyan-500/25"
                      : "bg-slate-800/80 text-white hover:bg-slate-800 border border-slate-700"
                  }`}
                >
                  <span>Buy License Key</span>
                  <ArrowRight size={14} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURE CHECKOUT MODAL */}
      <AnimatePresence>
        {isModalOpen && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md relative shadow-2xl shadow-cyan-500/10 text-left"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 border border-white/10"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>Instant Plugin License Key Purchase</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-1">Checkout: {selectedPlan.name}</h3>
              <p className="text-slate-400 text-xs mb-6">Enter your details. Your license key will be sent to your email immediately upon payment.</p>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address (Key will be sent here)</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    placeholder="factory@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">WhatsApp Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center gap-2 text-sm shadow-xl shadow-cyan-500/20"
                >
                  {isLoading ? "Generating Payment Link..." : `Pay ${selectedPlan.price} Securely`}
                  {!isLoading && <ArrowRight size={16} />}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Plugins;
