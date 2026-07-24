import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Zap, ShieldCheck, ArrowRight, X } from "lucide-react";

const plans = [
  {
    planId: "starter",
    name: "Starter",
    desc: "For small units handling up to 300 files/day",
    original: "₹2,500",
    price: "₹1,750",
    numericPrice: 1750,
    period: "/ month",
    features: ["Bulk CSV & Roster Import", "Auto Resize to Exact Inches", "Auto Rename by Order ID", "Print-Ready 300 DPI Export"],
    popular: false,
  },
  {
    planId: "pro",
    name: "Pro",
    desc: "For growing production units",
    original: "₹3,000",
    price: "₹2,000",
    numericPrice: 2000,
    period: "/ month",
    features: ["Unlimited roster files", "AI Roster Image Reader", "180° Brand Watermark & Size Tags", "Priority 300 DPI Export"],
    popular: true,
  },
  {
    planId: "premium",
    name: "Premium",
    desc: "For enterprise scale production",
    original: "₹4,000",
    price: "₹2,500",
    numericPrice: 2500,
    period: "/ month",
    features: ["Everything in Pro", "Multi-user Billing System", "Custom size grading tables", "Premium Support"],
    popular: false,
  },
  {
    planId: "enterprise",
    name: "Enterprise",
    desc: "For factories with custom needs",
    original: "₹6,000",
    price: "₹4,000",
    numericPrice: 4000,
    period: "/ month",
    features: ["Everything in Premium", "Dedicated account manager", "Custom plugin development", "On-site staff training"],
    popular: false,
  },
];

const PricingSection = () => {
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
      const API_BASE_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http'))
        ? import.meta.env.VITE_API_URL
        : DEFAULT_API_URL;
      const RENDER_API_URL = `${API_BASE_URL}/api/payment/create-link`;

      const response = await fetch(RENDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedPlan.numericPrice,
          email: email,
          phone: phone,
          planName: selectedPlan.name,
          planId: selectedPlan.planId,
          returnUrl: window.location.origin,
        }),
      });

      const resText = await response.text();
      let data: any = {};
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch (e) {
        throw new Error(`Server error (${response.status}). Please try again.`);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to generate payment link. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Server is currently busy. Please try again in a moment.");
      setIsLoading(false);
    }
  };

  return (
    <section id="pricing" className="py-24 md:py-36 relative overflow-hidden">
      {/* Background glow */}
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
            ⚡ Transparent Production Licensing
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Select Your <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Factory Capacity</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            No hidden setup fees. Instant online license activation for sportswear manufacturers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              key={plan.name}
              className={`relative rounded-3xl p-6 md:p-8 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 ${
                plan.popular
                  ? "bg-slate-900/90 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/20"
                  : "bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-xs font-extrabold shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles size={12} />
                  Most Popular Factory Choice
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-400 mb-6 min-h-[32px]">{plan.desc}</p>

                <div className="mb-6 pb-6 border-b border-slate-800">
                  <span className="text-xs text-slate-500 line-through mr-2 font-semibold">{plan.original}</span>
                  <span className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-400 font-medium ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-300">
                      <Check size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openCheckout(plan)}
                className={`w-full py-3.5 rounded-xl text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black shadow-lg shadow-cyan-500/25"
                    : "bg-slate-800/80 text-white hover:bg-slate-800 border border-slate-700"
                }`}
              >
                <span>Get Started Now</span>
                <ArrowRight size={14} />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECURE CHECKOUT MODAL WITH ANIMATEPRESENCE */}
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
                <span>Instant License Activation</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-1">Checkout: {selectedPlan.name} Plan</h3>
              <p className="text-slate-400 text-xs mb-6">Enter your details to receive your software license & setup guide.</p>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
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
                  {isLoading ? "Connecting to Gateway..." : `Pay ${selectedPlan.price} Securely`}
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

export default PricingSection;
