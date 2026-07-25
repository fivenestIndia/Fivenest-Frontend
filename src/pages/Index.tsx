import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustBadges from "@/components/TrustBadges";
import BeforeAfterSection from "@/components/BeforeAfterSection";
import ProductionWorkflowVideo from "@/components/ProductionWorkflowVideo";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import DashboardShowcaseSection from "@/components/DashboardShowcaseSection";
import ROICalculator from "@/components/ROICalculator";
import CaseStudiesSection from "@/components/CaseStudiesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  return (
    <div className="min-h-screen relative bg-slate-950 text-white selection:bg-cyan-500 selection:text-black">
      <Navbar />
      <HeroSection />
      <TrustBadges />
      <div id="before-after"><BeforeAfterSection /></div>
      <div id="workflow-demo"><ProductionWorkflowVideo /></div>
      <FeaturesSection />
      <HowItWorksSection />
      <div id="dashboard-showcase"><DashboardShowcaseSection /></div>
      <ROICalculator />
      <div id="case-studies"><CaseStudiesSection /></div>
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
