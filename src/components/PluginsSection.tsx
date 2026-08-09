import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  X,
  Laptop,
  FileSpreadsheet,
  Maximize2,
  Box,
  Cpu,
  Key,
  AlertCircle,
  Zap,
  CheckCircle2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

// Subscription plans matching backend server config (server/config/plans.js)
const pluginPlans = [
  {
    planId: "starter",
    name: "Starter Plugin License",
    desc: "For small print shops & single designer setup",
    monthlyPrice: "₹500",
    monthlyNumeric: 500,
    yearlyPrice: "₹5,000",
    yearlyNumeric: 5000,
    fileLimit: "500 Pcs / Month",
    devices: "1 Device Allowed",
    features: [
      "Photoshop, Illustrator & CorelDraw Panels",
      "Up to 500 Jersey File Exports / Month",
      "1 Device / Workstation Bound Key",
      "Auto Inch Size Grading (S to 7XL)",
      "Bulk CSV Roster Auto-Generation",
      "GPay & UPI Monthly Auto-Pay Support",
    ],
    popular: false,
    badge: "500 Files/mo"
  },
  {
    planId: "pro",
    name: "Pro Plugin License",
    desc: "For growing sublimation production & medium print units",
    monthlyPrice: "₹1,000",
    monthlyNumeric: 1000,
    yearlyPrice: "₹10,000",
    yearlyNumeric: 10000,
    fileLimit: "2,000 Pcs / Month",
    devices: "1 Device Allowed",
    features: [
      "Everything in Starter Plan",
      "Up to 2,000 Jersey File Exports / Month",
      "1 Device / Workstation Bound Key",
      "AI Roster Image Reader (OCR Notes)",
      "Custom Size Grading Patterns Database",
      "Fast Multi-Core Render Export Speed",
    ],
    popular: true,
    badge: "Most Popular (2K Files)"
  },
  {
    planId: "premium",
    name: "Premium Plugin License",
    desc: "For high-output sportswear factories & volume production",
    monthlyPrice: "₹1,250",
    monthlyNumeric: 1250,
    yearlyPrice: "₹12,500",
    yearlyNumeric: 12500,
    fileLimit: "5,000 Pcs / Month",
    devices: "1 Device Allowed",
    features: [
      "Everything in Pro Plan",
      "Up to 5,000 Jersey File Exports / Month",
      "1 Device / Workstation Bound Key",
      "Full PSD, AI & CDR Template Library Access",
      "High-Resolution 300 DPI Batch Export",
      "Priority WhatsApp License Support",
    ],
    popular: false,
    badge: "5K Files/mo"
  },
  {
    planId: "enterprise",
    name: "Enterprise Plugin License",
    desc: "For high-volume factories requiring unlimited file exports",
    monthlyPrice: "₹1,500",
    monthlyNumeric: 1500,
    yearlyPrice: "₹15,000",
    yearlyNumeric: 15000,
    fileLimit: "Unlimited Files",
    devices: "1 Device Allowed",
    features: [
      "Everything in Premium Plan",
      "UNLIMITED Jersey File Exports / Month",
      "Multiple Team Process & Multi-User Support",
      "Auto Billing & Instant Invoice Generation",
      "Custom ExtendScript / JSX Automation",
      "24/7 Dedicated Account Manager Support",
    ],
    popular: false,
    badge: "Unlimited Files"
  },
];

const pluginCapabilities = [
  {
    icon: FileSpreadsheet,
    title: "Bulk CSV Roster Import",
    description: "Import Excel/CSV lists of player names, numbers, sizes, and sponsor logos directly into Photoshop & CorelDraw layers."
  },
  {
    icon: Maximize2,
    title: "Auto Inch Size Grading",
    description: "Automatically scale chest width, height, sleeve length, and collar measurements across all sizes (S to 7XL)."
  },
  {
    icon: Box,
    title: "3D Live Mockup Preview",
    description: "Preview final sublimation patterns in 3D directly inside your design software before printing."
  },
  {
    icon: Cpu,
    title: "High-Speed 300 DPI Export",
    description: "Export ultra-crisp, print-ready PDF, TIFF, or PSD files with automatic bleed lines and custom file names."
  }
];

export const PluginsSection: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentId = searchParams.get("razorpay_payment_id");
    const paymentStatus = searchParams.get("razorpay_payment_link_status");
    if (paymentId || paymentStatus === "paid") {
      navigate(`/success${window.location.search}`);
    }
  }, [navigate]);

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

      const priceToPay = billingCycle === "yearly" ? selectedPlan.yearlyNumeric : selectedPlan.monthlyNumeric;

      const response = await fetch(RENDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: priceToPay,
          email: email.trim(),
          phone: phone.trim(),
          planName: `${selectedPlan.name} (${billingCycle === "yearly" ? "Yearly" : "Monthly Auto-Pay"})`,
          planId: selectedPlan.planId,
          billingCycle: billingCycle,
          returnUrl: window.location.origin,
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
      console.error("Payment Error:", error);
      alert("Server is currently busy. Please try again in a moment.");
      setIsLoading(false);
    }
  };

  return (
    <section id="plugins-pricing" className="py-24 md:py-36 relative overflow-hidden bg-slate-950/80 border-t border-slate-900">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Title Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-flex items-center gap-1.5">
            <Sparkles size={14} /> Photoshop, Illustrator & CorelDraw Extensions
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            FiveNest <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">Desktop FN Plugins</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg mb-8">
            Buy 1-Device activation keys with monthly GPay & UPI Auto-Pay options.
          </p>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 gap-2">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                billingCycle === "monthly"
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly Auto-Pay
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly Billing <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">Save ~20%</span>
            </button>
          </div>
        </motion.div>

        {/* Feature Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {pluginCapabilities.map((cap, idx) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                  <cap.icon size={20} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{cap.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{cap.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Plugin Subscription Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {pluginPlans.map((plan, i) => {
            const displayPrice = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const displayPeriod = billingCycle === "yearly" ? "/ year" : "/ month";

            return (
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
                    <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {displayPrice}
                    </span>
                    <span className="text-xs text-slate-400 font-medium ml-1">{displayPeriod}</span>

                    <div className="mt-3 space-y-1">
                      <div className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5">
                        <Laptop size={14} /> 1 Device Allowed (HWID Lock)
                      </div>
                      <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> File Limit: {plan.fileLimit}
                      </div>
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
                  <span>Buy 1-Device Key ({displayPrice})</span>
                  <ArrowRight size={14} />
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* View Full Plugins Page CTA */}
        <div className="mt-12 text-center">
          <Link to="/plugins">
            <button className="px-6 py-3 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-400 font-bold text-xs transition-all inline-flex items-center gap-2">
              <Key size={14} /> View Full Key Activation Instructions & Guides →
            </button>
          </Link>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
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
                <span>1-Device Plugin License Purchase</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-1">Checkout: {selectedPlan.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                <span>Cycle: <strong className="text-cyan-400 capitalize">{billingCycle}</strong></span>
                <span>•</span>
                <span>Limit: <strong className="text-emerald-400">{selectedPlan.fileLimit}</strong></span>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address (Key delivered here)</label>
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

                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Zap size={14} /> GPay & UPI Monthly Auto-Pay Supported
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Select GPay, PhonePe, Paytm, UPI or Card during payment to enable automatic monthly subscription renewal.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center gap-2 text-sm shadow-xl shadow-cyan-500/20"
                >
                  {isLoading ? "Generating Payment Link..." : `Pay ${billingCycle === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice} Securely`}
                  {!isLoading && <ArrowRight size={16} />}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
