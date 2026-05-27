import { useSearchParams, Link } from "react-router-dom";
import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, Mail, Download, ArrowLeft, MessageSquare } from "lucide-react";

const Success = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("razorpay_payment_id");
  const paymentStatus = searchParams.get("razorpay_payment_link_status");
  const email = searchParams.get("email") || "your email address";
  const planId = searchParams.get("planId") || "starter";

  const getPlanName = (id: string) => {
    switch (id) {
      case "starter": return "Starter Plan";
      case "pro": return "Pro Plan";
      case "premium": return "Premium Plan";
      case "enterprise": return "Enterprise Plan";
      default: return "Subscription";
    }
  };

  const isAccessAuthorized = paymentId || paymentStatus === "paid" || (email !== "your email address" && searchParams.get("planId") !== null);

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

          {/* Details Card */}
          <div className="bg-secondary/40 border border-border rounded-2xl p-6 text-left mb-8 space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">License key sent to email</p>
                <p className="text-sm text-muted-foreground">
                  We've sent a unique license key for the <strong className="text-foreground">{getPlanName(planId)}</strong> to <strong className="text-primary">{email}</strong>.
                </p>
              </div>
            </div>
            
            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold mb-2">Next Steps:</p>
              <ul className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
                <li>Check your email inbox (and promotions/spam folder) for a message from Fivenest.</li>
                <li>Download the Photoshop plugin using the button below.</li>
                <li>Install the plugin and enter your license key to activate it.</li>
              </ul>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://www.fivenest.in/download"
              className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer glow-sm"
            >
              <Download className="w-4 h-4" /> Download Installer
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
