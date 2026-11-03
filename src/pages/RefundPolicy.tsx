import React from 'react';
import { Link } from 'react-router-dom';
import { 
  RefreshCw, 
  CheckCircle2, 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Wallet,
  Copy,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#171717] font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 sm:py-24 w-full">
        {/* Page Header */}
        <div className="mb-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-[#71717A] hover:text-[#E4572E] transition-colors mb-6 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
            <RefreshCw size={14} /> Fair Merchant Terms & Guarantees
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
            Cancellation & Refund Policy
          </h1>
          <p className="text-sm text-[#71717A] font-medium">
            Effective Date: November 4, 2026 • Compliant with Razorpay Merchant Standards
          </p>
        </div>

        {/* Highlights Banner with 100% Duplicate Refund Callout */}
        <div className="bg-[#FAF9F6] border-2 border-[#E8E4DE] rounded-3xl p-6 sm:p-8 mb-12 shadow-soft">
          <h2 className="text-lg font-black text-[#171717] mb-4 flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-600" />
            Core Refund Guarantees at a Glance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#52525B]">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#E8E4DE]">
              <Copy size={18} className="text-[#E4572E] flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#171717] block mb-0.5">100% Refund on Duplicate Jobs:</strong>
                Exported the exact same order or jersey batch twice by accident? Raise a query within <strong>72 hours</strong> and get a 100% refund credited back to your FiveNest Wallet (not as real cash).
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#E8E4DE]">
              <Wallet size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#171717] block mb-0.5">Wallet Credit Generation:</strong>
                All duplicate refunds are generated directly into your FiveNest Production Wallet for immediate reuse on upcoming jersey orders.
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#E8E4DE]">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#171717] block mb-0.5">Same-Order Free Revisions:</strong>
                Found a typo or wrong player number on an exported batch? Re-exports for the exact same order roster are 100% free of charge within 48 hours.
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#E8E4DE]">
              <Clock size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#171717] block mb-0.5">Prompt 72-Hour Window:</strong>
                Submit your duplicate job query via WhatsApp or email within 72 hours of the export; verified credits are restored within 4 to 12 working hours.
              </span>
            </div>
          </div>
        </div>

        {/* Policy Details */}
        <div className="space-y-10 text-sm leading-relaxed text-[#3F3F46]">

          {/* Section 1: 100% Refund of Duplicate Jobs */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-[#E4572E]/30 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E4572E]/5 rounded-bl-full pointer-events-none" />

            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-[#E4572E]/10 text-[#E4572E] flex items-center justify-center font-black text-xs">
                1
              </span>
              <h2 className="text-xl font-black text-[#171717]">
                100% Refund Policy for Duplicate Jobs
              </h2>
            </div>

            <p className="mb-4 text-[#52525B]">
              In the fast-paced environment of sublimation sportswear manufacturing, network lag or accidental double-clicking can occasionally result in submitting or exporting the exact same job twice. We offer a transparent, 100% protection guarantee for such occurrences:
            </p>

            <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#E8E4DE] space-y-3 mb-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#171717]">100% Amount Refunded:</strong> If you accidentally exported or were charged twice for an identical job (same roster, player names, and artwork), we refund 100% of the duplicate job&apos;s charged amount.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={18} className="text-[#E4572E] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#171717]">72-Hour Query Window:</strong> You must raise your query within <strong>72 hours</strong> of the duplicate export timestamp. Queries raised after 72 hours cannot be verified against live factory export logs and will be considered expired.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Wallet size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#171717]">Credited to Wallet (Not Real Cash):</strong> Your refund will generate and credit directly into your <strong>FiveNest Account Wallet</strong> as production credits. Refunds are <strong>not provided in real cash, bank payouts, or direct UPI transfers</strong>. The credited amount remains in your wallet and can be used immediately for future jersey export jobs.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-orange-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-orange-900">
                <Sparkles size={14} className="text-[#E4572E]" /> How to Raise a Duplicate Job Query:
              </p>
              <p>
                Send a message via WhatsApp to <strong>+91 88792 28710</strong> or email <a href="mailto:fivenest.india@gmail.com" className="font-bold underline text-[#E4572E]">fivenest.india@gmail.com</a> with:
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Your registered FiveNest account email ID or mobile number</li>
                <li>The order number or customer name for the duplicate job</li>
                <li>Approximate date and time of the duplicate export</li>
              </ul>
              <p className="pt-1 text-[11px] text-orange-800 font-medium">
                Our support team will verify the twin export in server records and restore 100% of the deducted amount to your wallet within 4 to 12 working hours.
              </p>
            </div>
          </section>

          {/* Section 2: Same-Order Free Revisions Policy */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-gray-100 text-[#171717] flex items-center justify-center font-black text-xs">
                2
              </span>
              <h2 className="text-xl font-bold text-[#171717]">Same-Order Free Revisions Policy</h2>
            </div>
            <p className="mb-3">
              We understand that sports teams and school squad coordinators frequently request spelling fixes or player number swaps after initial file generation:
            </p>
            <p className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E8E4DE] text-[#171717] font-medium text-xs sm:text-sm">
              <strong>Our Revision Guarantee:</strong> Re-exporting corrections for an existing order batch (e.g. fixing a player&apos;s name spelling or updating a sponsor logo on the same roster) is provided free of charge under our revision policy within 48 hours of original generation.
            </p>
          </section>

          {/* Section 3: Wallet Recharges & Subscriptions */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-gray-100 text-[#171717] flex items-center justify-center font-black text-xs">
                3
              </span>
              <h2 className="text-xl font-bold text-[#171717]">Wallet Recharges & Production Credits</h2>
            </div>
            <p className="mb-3">
              FiveNest operates on an upfront wallet / token system where 100% of your recharge funds are converted into export production credits at discounted tier rates:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3 text-xs sm:text-sm">
              <li>
                <strong>Unused Recharge Balances:</strong> If you accidentally recharged your wallet (e.g., entered ₹5,000 instead of ₹2,500), you may request a refund for the unconsumed balance to your original payment method within <strong>7 days of transaction</strong>.
              </li>
              <li>
                <strong>Consumed Credits:</strong> Because FiveNest delivers immediate digital rendering outputs (high-resolution print-ready ZIP files with exact millimeter sizing), credits that have already been expended to export unique, valid jersey files are non-refundable.
              </li>
              <li>
                <strong>Promotional / Trial Credits:</strong> Promotional credits (such as the ₹500 Free Trial Offer or referral vouchers) are non-withdrawable goodwill credits and cannot be converted to physical cash.
              </li>
            </ul>
          </section>

          {/* Section 4: Technical Defects & Failed Exports */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-gray-100 text-[#171717] flex items-center justify-center font-black text-xs">
                4
              </span>
              <h2 className="text-xl font-bold text-[#171717]">Technical Defects & Render Failures</h2>
            </div>
            <p className="mb-3">
              In the rare event of a platform server glitch where an export fee was debited but the ZIP file download failed or the generated vector output was corrupted:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 mb-3 text-xs sm:text-sm">
              <li>Our automated system detects failed generation and restores the debited credits back to your wallet immediately.</li>
              <li>If the credit was not auto-restored, send us your Order Code or Transaction Reference, and our technical operations team will credit your wallet within 4 working hours.</li>
            </ol>
          </section>

          {/* Section 5: Subscription Cancellation & Account Closure */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-gray-100 text-[#171717] flex items-center justify-center font-black text-xs">
                5
              </span>
              <h2 className="text-xl font-bold text-[#171717]">Subscription Cancellation Process</h2>
            </div>
            <p className="mb-3">
              FiveNest does not employ deceptive lock-ins or recurring auto-debit traps:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>You can choose not to renew your monthly or quarterly pack at any time.</li>
              <li>To cancel or close your account, navigate to the <strong>Plans / Recharge</strong> modal in the Studio or visit our Data Privacy portal to request account closure.</li>
              <li>Existing credits in your wallet will remain accessible until fully consumed.</li>
            </ul>
          </section>

          {/* Section 6: Razorpay Settlement & Timelines */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-gray-100 text-[#171717] flex items-center justify-center font-black text-xs">
                6
              </span>
              <h2 className="text-xl font-bold text-[#171717]">Refund Timelines & Payment Source</h2>
            </div>
            <p className="mb-3">
              For eligible bank/cash refunds (such as accidental wallet over-recharges requested within 7 days), payments are processed via our authorized payment partner, <strong>Razorpay</strong>, strictly to the original source:
            </p>
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DE] text-xs space-y-2">
              <p><strong>UPI Payments (GPay, PhonePe, Paytm, BHIM):</strong> Credited to your linked bank account within 24 to 48 hours.</p>
              <p><strong>Netbanking / Debit Cards:</strong> Reflected in your bank statement within <strong>5 to 7 business days</strong>, subject to your bank&apos;s settlement schedule.</p>
              <p><strong>Duplicate Job Refunds:</strong> Credited <strong>100% to your FiveNest Wallet balance</strong> within 4 to 12 working hours of query receipt (query must be raised within 72 hours).</p>
              <p><strong>Support & Inquiries:</strong> Contact <a href="mailto:fivenest.india@gmail.com" className="text-[#E4572E] font-bold">fivenest.india@gmail.com</a> or WhatsApp <strong>+91 88792 28710</strong> with your payment receipt.</p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
