import { useEffect, useRef, useState } from "react";

const plans = [
  {
    planId: "starter",
    name: "Starter",
    desc: "For small units handling up to 300 files/day",
    original: "₹2,500",
    price: "₹1,750",
    numericPrice: 1750,
    period: "/ month",
    features: ["Bulk CSV Import", "Auto Resize to Exact Inches", "Auto Rename by Order ID", "Print-Ready 300 DPI Export"],
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
    features: ["Unlimited files", "Advanced naming logic", "Faster processing", "Priority support"],
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
    features: ["Unlimited files", "Multi-device logic", "Custom integrations", "Premium Support"],
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
    features: ["Everything in Premium", "Dedicated account manager", "Custom plugin development", "On-site training"],
    popular: false,
  },
];

const PricingSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // --- NEW: CHECKOUT STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // --- NEW: HANDLE BUTTON CLICK ---
  const openCheckout = (plan: any) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  // --- NEW: CONNECT TO RENDER BACKEND ---
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone) return alert("Please enter your email and phone number.");
    setIsLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
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
          returnUrl: window.location.origin, // Returns them to this website after paying
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url; // Send to Razorpay
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
    <section id="pricing" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Select Your <span className="text-gradient">Production Capacity</span>
          </h2>
          <p className="text-muted-foreground text-lg">Transparent pricing for manufacturing units of all sizes</p>
        </div>

        <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative glass-card rounded-2xl p-6 flex flex-col transition-all duration-500 hover:-translate-y-2 ${
                plan.popular ? "border-primary/40 glow-sm" : ""
              } ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>

              <div className="mb-6">
                <span className="text-sm text-muted-foreground line-through mr-2">{plan.original}</span>
                <span className="text-3xl font-black text-gradient">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-primary">✓</span>
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              {/* 🔥 UPDATED BUTTON: NOW OPENS THE CHECKOUT MODAL */}
              <button
                onClick={() => openCheckout(plan)}
                className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:opacity-90 glow-sm"
                    : "border border-border hover:bg-secondary"
                }`}
              >
                Get Started Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 NEW: SECURE CHECKOUT MODAL */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl p-6 md:p-8 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl"
            >
              ✕
            </button>
            
            <h3 className="text-2xl font-bold mb-2">Checkout: {selectedPlan.name}</h3>
            <p className="text-muted-foreground text-sm mb-6">Enter your details to receive your software license and setup guide.</p>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="fivenest.india@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                <input 
                  type="tel" 
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+91 98765 43210"
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 mt-4 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {isLoading ? "Connecting to Secure Gateway..." : `Pay ${selectedPlan.price} Securely`}
                {!isLoading && <span>→</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default PricingSection;
