import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, Mail, Download, ArrowLeft, MessageSquare, Copy, Check, Key } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://fivenest-backend.onrender.com";

const Success = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("razorpay_payment_id");
  const paymentStatus = searchParams.get("razorpay_payment_link_status");
  const email = searchParams.get("email") || "";
  const planId = searchParams.get("planId") || "starter";

  const [licenseKey, setLicenseKey] = useState<string>("");
  const [isFulfilling, setIsFulfilling] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<string>("sending");

  const getPlanName = (id: string) => {
    switch (id.toLowerCase()) {
      case "starter": return "Starter Plan";
      case "pro": return "Pro Plan";
      case "premium": return "Premium Plan";
      case "enterprise": return "Enterprise Plan";
      default: return "Subscription";
    }
  };

  useEffect(() => {
    const triggerFulfillment = async () => {
      if (!email && !paymentId) {
        setIsFulfilling(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/payment/fulfill-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: paymentId || `pay_${Date.now()}`,
            email: email,
            planId: planId,
            planName: getPlanName(planId),
          }),
        });

        const data = await response.json();
        if (data.success && data.licenseKey) {
          setLicenseKey(data.licenseKey);
          setEmailStatus(data.emailSent ? "sent" : "failed");
        } else {
          console.warn("Fulfillment API response:", data);
        }
      } catch (err) {
        console.error("Error triggering license key fulfillment:", err);
      } finally {
        setIsFulfilling(false);
      }
    };

    triggerFulfillment();
  }, [email, paymentId, planId]);

  const handleCopy = () => {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAccessAuthorized = paymentId || paymentStatus === "paid" || (email !== "" && searchParams.get("planId") !== null);

  if (!isAccessAuthorized) {
    return (
      <div className="min-h-screen relative flex flex-col justify-between">
        <AuroraBackground />
        <Navbar />
        <main className="container mx-auto px-6 py-32 flex-1 flex flex-col items-center justify-center relative z-10">
          <div className="glass-card max-w-md w-full rounded-3xl p-8 text-center border border-red-500/20 glow-sm">
            <div className="text-4xl text-red-500 mb-4 font-bold">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              This page is only accessible after a successful transaction. Direct access is restricted.
            </p>
            <Link
              to="/"
              className="inline-flex px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Go to Homepage
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-between">
      <AuroraBackground />
      <Navbar />

      <main className="container mx-auto px-6 py-32 flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="glass-card max-w-2xl w-full rounded-3xl p-8 md:p-12 text-center border border-primary/20 glow-sm">
          {/* Animated checkmark */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black mb-4">
            Payment <span className="text-gradient">Successful!</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Thank you for choosing Fivenest. Your transaction has been processed.
          </p>

          {/* License Key Card */}
          <div className="bg-primary/10 border border-primary/40 rounded-2xl p-6 text-center mb-8 relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
              <Key className="w-4 h-4" /> Your Software License Key
            </div>

            {isFulfilling ? (
              <div className="text-muted-foreground text-sm py-3 animate-pulse">Generating your license key...</div>
            ) : licenseKey ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3 bg-background/80 border border-primary/30 rounded-xl px-4 py-3 max-w-md mx-auto">
                  <span className="font-mono text-xl md:text-2xl font-bold text-foreground tracking-wider select-all">
                    {licenseKey}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center"
                    title="Copy License Key"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Plan: <strong className="text-foreground">{getPlanName(planId)}</strong>
                </p>
              </div>
            ) : (
              <div className="text-sm text-yellow-500 py-2">
                License generated. Please check your email for the key details.
              </div>
            )}
          </div>

          {/* Details Card */}
          <div className="bg-secondary/40 border border-border rounded-2xl p-6 text-left mb-8 space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">
                  {emailStatus === "sent" ? "License key sent to email" : "Email status"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {email ? (
                    <>We've dispatched your unique license key to <strong className="text-primary">{email}</strong>.</>
                  ) : (
                    <>Check your registered email address for the license key & receipt.</>
                  )}
                </p>
              </div>
            </div>
            
            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold mb-2">Next Steps:</p>
              <ul className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
                <li>Copy the license key above or check your email inbox (and spam/promotions folder).</li>
                <li>Download the Photoshop plugin using the button below.</li>
                <li>Install the plugin and enter your email & license key to activate it.</li>
              </ul>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://www.fivenest.in/download"
              className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer glow-sm"
            >
              <Download className="w-4 h-4" /> Download Plugin Installer
            </a>
            
            <Link
              to="/"
              className="w-full sm:w-auto px-8 py-3 border border-border text-foreground font-semibold rounded-xl hover:bg-secondary transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Return Home
            </Link>
          </div>

          {/* WhatsApp Support CTA */}
          <div className="mt-8 pt-6 border-t border-border/50 text-sm text-muted-foreground flex flex-col sm:flex-row gap-2 justify-center items-center">
            <span>Didn't receive the email or need help?</span>
            <a
              href="https://wa.me/919876543210?text=Hi%20Fivenest%20Support%2C%20I%20just%20purchased%20a%20plugin%20subscription%20but%20need%20assistance%20setting%20it%20up."
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <MessageSquare className="w-4 h-4" /> Message Support on WhatsApp
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Success;
