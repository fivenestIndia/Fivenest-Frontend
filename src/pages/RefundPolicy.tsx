import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle2, AlertCircle, ArrowLeft, Clock, ShieldCheck, Mail, Phone, HelpCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function RefundPolicy() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
            <RefreshCw size={14} /> Fair Merchant Terms
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
            Cancellation & Refund Policy
          </h1>
          <p className="text-sm text-[#71717A] font-medium">
            Effective Date: November 2, 2026 • Compliant with Razorpay Merchant Standards
          </p>
        </div>

        {/* Highlights Banner */}
        <div className="bg-[#FAF9F6] border-2 border-[#E8E4DE] rounded-3xl p-6 sm:p-8 mb-12 shadow-soft">
          <h2 className="text-lg font-black text-[#171717] mb-3 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            Clear & Honest Refund Terms
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#52525B]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Free Revisions:</strong> Exported a batch and found a typo in a player&apos;s name? Re-exports for the exact same order roster are 100% free of charge.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Unused Wallet Balance:</strong> Recharged by mistake? Unconsumed wallet credits can be refunded to your original payment method upon request within 7 days.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Quick Processing:</strong> Approved refunds are credited directly back to your original source (UPI, netbanking, or card) within 5 to 7 business days.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Defective Render Guarantee:</strong> If our engine generates a corrupted file or technical error, credits are instantly refunded to your balance.</span>
            </div>
          </div>
        </div>

        {/* Policy Details */}
        <div className="space-y-10 text-sm leading-relaxed text-[#3F3F46]">
          {/* Section 1 */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">1. Same-Order Free Revisions Policy</h2>
            <p className="mb-3">
              We understand the realities of active sports apparel manufacturing. Squad captains frequently submit last-minute spelling corrections or player jersey number changes after initial file generation.
            </p>
            <p className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E8E4DE] text-[#171717] font-medium">
              <strong>Our Revision Guarantee:</strong> Re-exporting corrections for an existing order batch (e.g. correcting a player&apos;s name spelling, updating a sponsor logo on the same roster) is provided free of charge under our revision policy within 48 hours of original generation.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">2. Wallet Recharges & Pack Subscriptions</h2>
            <p className="mb-3">
              FiveNest operates on an upfront wallet / token system where 100% of your recharge funds are converted into export production credits.
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li><strong>Unused Credits:</strong> If you accidentally recharged your wallet (e.g., entered ₹5,000 instead of ₹2,500), you may request a refund for the unused balance within <strong>7 days of transaction</strong>.</li>
              <li><strong>Consumed Credits:</strong> Because FiveNest delivers immediate digital rendering outputs (high-resolution CMYK ZIP files), credits that have already been expended to generate and download print-ready panels are non-refundable.</li>
              <li><strong>Promotional / Trial Credits:</strong> Promotional credits (such as the ₹500 Free Trial Offer or goodwill vouchers) are non-withdrawable promotional credits and cannot be converted to physical cash.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">3. Technical Defects & Failed Exports</h2>
            <p className="mb-3">
              In the rare event of a platform server failure where an export fee was debited but the ZIP file download failed or the generated vector output was mathematically distorted:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 mb-3">
              <li>Our automated system detects failed generation and restores the debited credits back to your wallet immediately.</li>
              <li>If the credit was not auto-restored, simply email us your Transaction Reference ID or order number, and our operations team will manually credit your balance within 4 working hours.</li>
            </ol>
          </section>

          {/* Section 4 */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">4. Subscription Cancellation Process</h2>
            <p className="mb-3">
              FiveNest does not employ deceptive cancellation hurdles or hidden subscription traps:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You can choose not to renew your Monthly or Quarterly pack at any time.</li>
              <li>To cancel or close your account, simply navigate to the <strong>Plans / Recharge</strong> modal in the Studio or visit our Data Privacy portal to request account deletion.</li>
              <li>Existing credits in your wallet will remain accessible until the expiration date of your current plan.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">5. Refund Timeline & Processing Method</h2>
            <p className="mb-3">
              All approved refunds are processed via our authorized payment partner, <strong>Razorpay</strong>, strictly to the original payment source:
            </p>
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DE] text-xs space-y-2">
              <p><strong>UPI Payments (GPay, PhonePe, Paytm, BHIM):</strong> Credited to your linked bank account within 24 to 48 hours.</p>
              <p><strong>Netbanking / Debit Cards:</strong> Reflected in your bank statement within <strong>5 to 7 business days</strong>, subject to your bank&apos;s settlement schedule.</p>
              <p><strong>Support & Inquiries:</strong> Contact <a href="mailto:fivenest.india@gmail.com" className="text-[#E4572E] font-bold">fivenest.india@gmail.com</a> or WhatsApp <strong>+91 88792 28710</strong> with your payment receipt.</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
