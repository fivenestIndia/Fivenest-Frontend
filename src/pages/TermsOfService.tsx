import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, Zap, Scale, HeartHandshake } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#171717] font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 sm:py-24 w-full">
        <div className="mb-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-[#71717A] hover:text-[#E4572E] transition-colors mb-6 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4572E]/10 border border-[#E4572E]/20 text-[#E4572E] text-xs font-bold uppercase tracking-wider mb-3">
            <Scale size={14} /> Master SaaS Agreement
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-[#71717A] font-medium">
            Effective Date: November 2, 2026 • Version 2026.11
          </p>
        </div>

        {/* Quick Highlights Card */}
        <div className="bg-[#FAF9F6] border-2 border-[#E8E4DE] rounded-3xl p-6 sm:p-8 mb-12 shadow-soft">
          <h2 className="text-lg font-black text-[#171717] mb-3 flex items-center gap-2">
            <HeartHandshake size={18} className="text-[#E4572E]" />
            Key Terms & Commitments
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#52525B]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>100% Intellectual Property Ownership:</strong> You retain full copyright of all jersey graphics, custom logos, patterns, and player lists uploaded or processed through FiveNest.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>No Hidden Fees:</strong> Pay-as-you-go export is billed transparently at ₹3.50/pc (with FiveNest tag) or ₹5.50/pc (white-label). Front and sleeve panels are always free.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Easy Subscription Cancellation:</strong> Zero lock-in contracts. Cancel any subscription at any time without exit fees or penalties.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Same-Order Free Revisions:</strong> Re-exporting corrections for the exact same order is 100% complimentary under our revision policy.</span>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-10 text-sm leading-relaxed text-[#3F3F46]">
          {/* Section 1 */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">1. Agreement to Terms</h2>
            <p className="mb-3">
              By registering an account, accessing, or using <strong>FiveNest</strong> (provided by FiveNest India, Mumbai), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service, our Privacy Policy, and our Refund Policy.
            </p>
            <p>
              If you represent an apparel manufacturing business, sportswear brand, or printing facility, you warrant that you possess full corporate authority to bind that entity to these Terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">2. Description of Services & Platform Access</h2>
            <p className="mb-3">
              FiveNest provides a high-throughput sublimation print automation operating system designed for sportswear factories. Capabilities include:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li>Smart multi-size pattern grading (Sizes 18 through 60).</li>
              <li>Batch squad roster injection for automated player names, numbers, and sponsor patches.</li>
              <li>Individual 300 DPI high-resolution RGB print panel export (ZIP/TIFF/JPG).</li>
              <li>Optional nesting preview and customer order management portal.</li>
            </ul>
            <p>
              FiveNest grants you a limited, revocable, non-exclusive, non-transferable license to access the studio strictly for lawful industrial manufacturing purposes.
            </p>
          </section>

          {/* Section 3 - IP & Logo Permissions */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">3. Intellectual Property, Customer Logos & Artwork Licensing</h2>
            <p className="mb-3">
              <strong>Your Content:</strong> You retain sole ownership of all graphics, sponsor emblems, vector typography, and roster data uploaded into FiveNest. FiveNest claims no ownership interest over your artwork.
            </p>
            <p className="mb-3">
              <strong>Customer Authorization & Representations:</strong> You expressly represent and warrant that you own or possess valid commercial authorization, licenses, or merchant permissions to reproduce any team crests, corporate sponsor logos, athletic brand marks, or copyrighted graphics included in your jerseys. FiveNest prohibits the unauthorized duplication of counterfeit or infringing trademarks.
            </p>
            <p>
              <strong>Platform Property:</strong> All software code, UI design, vector grading algorithms, and trade dress of FiveNest remain the exclusive intellectual property of FiveNest India.
            </p>
          </section>

          {/* Section 4 - Open Source & Font Licences */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">4. Open Source Licences & Font Obligations</h2>
            <p className="mb-3">
              FiveNest is constructed utilizing enterprise open-source software libraries, including React (MIT), Three.js (MIT), jsPDF (MIT), and JSZip (MIT). A copy of all applicable open-source notices is accessible in our repository.
            </p>
            <p>
              <strong>Typography & Fonts:</strong> FiveNest provides pre-bundled sports typography licensed under the SIL Open Font License (OFL) or Apache 2.0. When uploading custom TTF/OTF font files into the Studio, you are solely responsible for verifying that your business holds the appropriate commercial desktop/embedding font license.
            </p>
          </section>

          {/* Section 5 - Subscription & Billing */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">5. Subscriptions, Credits, Auto-Renewals & Cancellation</h2>
            <div className="space-y-3">
              <p>
                <strong>100% Value Conversion:</strong> Every rupee charged for a Monthly or Quarterly plan is 100% credited into your factory export wallet.
              </p>
              <p>
                <strong>Transparent Disclosures (No Hidden Traps):</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Monthly plans carry 30 days validity; Quarterly plans carry 90 days validity.</li>
                <li><strong>No Forced Auto-Charging:</strong> FiveNest does not store your card details or silently execute recurring debits without your express authorization. Renewal notices are dispatched via WhatsApp/email prior to expiry.</li>
                <li><strong>Hassle-Free Cancellation:</strong> You can choose not to renew at any time directly through the Plans modal, or request account closure without lock-in penalties.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 - Trial Terms */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">6. ₹500 Promotional Free Trial Offer Terms</h2>
            <p className="mb-3">
              Eligible manufacturing workspaces may claim up to ₹500 in promotional production credits:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mb-3">
              <li>Limit of one trial offer per registered business workspace and unique mobile number.</li>
              <li>Promotional credits expire 14 days following activation approval by FiveNest.</li>
              <li>Credits are non-withdrawable, non-transferable, and redeemable solely against production panel exports.</li>
              <li>Attempted duplicate registrations or synthetic identity abuse will result in account disqualification.</li>
            </ul>
          </section>

          {/* Section 7 - DMCA & Copyright Infringement */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">7. Copyright & DMCA Infringement Notification</h2>
            <p className="mb-3">
              FiveNest respects intellectual property rights. If you believe any content hosted on or produced through our platform infringes your copyright or trademark, please transmit a notice to our designated agent:
            </p>
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DE] text-xs">
              <p><strong>Copyright Agent:</strong> Legal Counsel, FiveNest India</p>
              <p><strong>Email:</strong> <a href="mailto:fivenest.india@gmail.com" className="text-[#E4572E] font-bold">fivenest.india@gmail.com</a></p>
              <p><strong>Subject Line:</strong> DMCA / Trademark Infringement Notice</p>
              <p>We review and act on verified takedown notices within 48 hours in accordance with the Indian Copyright Act, 1957 and international DMCA provisions.</p>
            </div>
          </section>

          {/* Section 8 - Realistic SLA & Liability */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">8. Service Availability (SLA) & Limitation of Liability</h2>
            <p className="mb-3">
              <strong>Realistic Uptime Commitment:</strong> We strive to maintain a <strong>99.5% cloud platform availability</strong> target, excluding scheduled maintenance windows announced in advance.
            </p>
            <p className="mb-3">
              <strong>Print Calibration Disclaimer:</strong> Computer monitors display colors in RGB, whereas sublimation printers output inks in CMYK. You are responsible for executing sample fabric swatches and printer RIP profiling before embarking on mass production runs.
            </p>
            <p>
              To the maximum extent permitted by Indian law, FiveNest shall not be liable for indirect, incidental, or consequential damages resulting from printer head jams, fabric shrinkage, or operator errors. Our total aggregate liability under any circumstance is capped at the total amount paid by you to FiveNest in the preceding 3 months.
            </p>
          </section>

          {/* Section 9 - Governing Law */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">9. Governing Law & Jurisdiction</h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, controversy, or claim arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts located in <strong>Mumbai, Maharashtra, India</strong>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
