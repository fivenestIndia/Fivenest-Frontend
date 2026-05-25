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

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <Navbar />
      <HeroSection />
      <TrustBadges />
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
};

export default Index;
