import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustBadges from "@/components/TrustBadges";
import { EcosystemStepsSection } from "@/components/EcosystemStepsSection";
import BeforeAfterSection from "@/components/BeforeAfterSection";
import RealFactorySection from "@/components/RealFactorySection";
import ProductionWorkflowVideo from "@/components/ProductionWorkflowVideo";
import ErrorPreventionSection from "@/components/ErrorPreventionSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import DashboardShowcaseSection from "@/components/DashboardShowcaseSection";
import SupportedFileTypesSection from "@/components/SupportedFileTypesSection";
import ROICalculator from "@/components/ROICalculator";
import CaseStudiesSection from "@/components/CaseStudiesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import WalletProductionSection from "@/components/WalletProductionSection";
import WalletHistoryPreview from "@/components/WalletHistoryPreview";
import { PluginsSection } from "@/components/PluginsSection";
import SecurityPrivacySection from "@/components/SecurityPrivacySection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  return (
    <div className="min-h-screen relative bg-slate-950 text-white selection:bg-cyan-500 selection:text-black">
      <Navbar />
      <HeroSection />
      <TrustBadges />
      <div id="process-ecosystem"><EcosystemStepsSection /></div>
      <div id="before-after"><BeforeAfterSection /></div>
      <RealFactorySection />
      <div id="workflow-demo"><ProductionWorkflowVideo /></div>
      <ErrorPreventionSection />
      <FeaturesSection />
      <div id="how-it-works"><HowItWorksSection /></div>
      <div id="dashboard-showcase"><DashboardShowcaseSection /></div>
      <div id="supported-formats"><SupportedFileTypesSection /></div>
      <ROICalculator />
      <div id="case-studies"><CaseStudiesSection /></div>
      <TestimonialsSection />
      <div id="plugins"><PluginsSection /></div>
      <div id="pricing"><WalletProductionSection /></div>
      <WalletHistoryPreview />
      <SecurityPrivacySection />
      <FAQSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
