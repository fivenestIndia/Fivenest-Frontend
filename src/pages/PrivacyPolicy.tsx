import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileText, CheckCircle2, UserCheck, Eye, Trash2, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function PrivacyPolicy() {
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
            <Shield size={14} /> Legal & Data Protection
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
            Privacy Policy & Data Protection
          </h1>
          <p className="text-sm text-[#71717A] font-medium">
            Last Updated & Effective Date: November 2, 2026 • Version 2026.11
          </p>
        </div>

        {/* Executive Highlights Summary */}
        <div className="bg-[#FAF9F6] border-2 border-[#E8E4DE] rounded-3xl p-6 sm:p-8 mb-12 shadow-soft">
          <h2 className="text-lg font-black text-[#171717] mb-3 flex items-center gap-2">
            <Lock size={18} className="text-[#E4572E]" />
            Privacy Summary at a Glance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#52525B]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Zero Unauthorized AI Training:</strong> We never use your proprietary jersey artwork, logos, or player rosters to train public AI models.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Strict Data Retention:</strong> Temporary raster render caches auto-purge after 48 hours. Inactive accounts purge after 12 months.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Full DPDP & GDPR Rights:</strong> Instant 1-click self-service export of your data and permanent account deletion under your Right to Erasure.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>No Hidden Trackers:</strong> We block third-party analytics until you grant consent via our Cookie Preference Center.</span>
            </div>
          </div>
        </div>

        {/* Main Privacy Content */}
        <div className="space-y-10 text-sm leading-relaxed text-[#3F3F46]">
          {/* Section 1 */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">1. Identity of Data Controller</h2>
            <p className="mb-3">
              This Privacy Policy applies to the services, software, and platforms provided by <strong>FiveNest India</strong> (&ldquo;FiveNest&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), operating the FiveNest Sublimation Design Studio and Order Management Portal accessible at <a href="https://www.fivenest.in" className="text-[#E4572E] font-semibold underline">https://www.fivenest.in</a>.
            </p>
            <p>
              We are committed to safeguarding your privacy and ensuring compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act, India)</strong>, the <strong>General Data Protection Regulation (GDPR)</strong>, and international data protection standards.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">2. Data We Collect</h2>
            <p className="mb-4">We collect only necessary information required to provide our sports apparel manufacturing software:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account & Identity Data:</strong> Name, business name, verified mobile phone number, email address, password hash, city, state, and optional GSTIN.</li>
              <li><strong>Production & Artwork Data:</strong> Vector and raster logos (PNG, SVG, PDF), jersey graphics, team colors, and squad rosters containing player names, squad numbers, and sizes.</li>
              <li><strong>Financial & Payment Transaction Records:</strong> Transaction reference IDs, invoice numbers, recharge amounts, and payment method identifiers provided by our authorized payment gateway (Razorpay). <em>Note: FiveNest never receives or stores raw credit card numbers, debit card PINs, or UPI passwords.</em></li>
              <li><strong>Technical & Usage Telemetry:</strong> Anonymized browser version, device viewport, IP address (for trial abuse prevention and geo-calibration), and timestamped session logs.</li>
            </ul>
          </section>

          {/* Section 3 - AI Training Clause */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <div className="flex items-center gap-2 text-[#E4572E] font-bold text-xs uppercase tracking-wider mb-2">
              <Lock size={15} /> Customer Intellectual Property Guarantee
            </div>
            <h2 className="text-xl font-bold text-[#171717] mb-3">3. Prohibition of Unauthorized AI Model Training</h2>
            <p className="mb-3">
              We understand that your sportswear patterns, custom typography, corporate sponsor emblems, and team uniforms constitute proprietary trade secrets and copyrighted artwork.
            </p>
            <p className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E8E4DE] font-medium text-[#171717]">
              <strong>Our Contractual Commitment:</strong> FiveNest strictly does NOT use, feed, sell, or license any customer-uploaded vector art, fabric templates, roster spreadsheets, or generated production outputs to train, fine-tune, or calibrate public artificial intelligence, machine learning, or neural network models. Your assets are processed solely to execute your real-time automated rendering and print file generation.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">4. Data Retention Schedule & Limits</h2>
            <p className="mb-4">We observe strict data minimization and retention limits:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-[#E8E4DE] rounded-xl overflow-hidden">
                <thead className="bg-[#FAF9F6] text-[#171717] font-bold">
                  <tr>
                    <th className="p-3 border-b border-[#E8E4DE]">Data Category</th>
                    <th className="p-3 border-b border-[#E8E4DE]">Retention Period</th>
                    <th className="p-3 border-b border-[#E8E4DE]">Purge / Archival Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DE]">
                  <tr>
                    <td className="p-3 font-semibold text-[#171717]">Temporary Export Render Caches (ZIP/TIFF/JPG)</td>
                    <td className="p-3">48 Hours from export</td>
                    <td className="p-3 text-red-600 font-medium">Permanently auto-deleted from cloud scratch cache</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#171717]">Saved Vector Designs & Size Profiles</td>
                    <td className="p-3">Duration of active account</td>
                    <td className="p-3">Retained while account remains active; deleted upon verified user request</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#171717]">Inactive Accounts with Zero Activity</td>
                    <td className="p-3">12 Months of continuous inactivity</td>
                    <td className="p-3">Account and stored roster data scheduled for automated deletion</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#171717]">Financial Invoices & Payment Ledger Records</td>
                    <td className="p-3">7 Years</td>
                    <td className="p-3">Mandatory statutory retention under Indian Tax & GST Regulations</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5 - Subprocessors */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">5. Authorized Third-Party Subprocessors</h2>
            <p className="mb-4">
              To operate our high-speed sublimation engine, we engage certified infrastructure partners under strict Data Processing Agreements:
            </p>
            <ul className="space-y-3">
              <li className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4DE]">
                <strong className="text-[#171717]">Supabase Inc.</strong> (Database, Row-Level Security & Authentication): Cloud data hosting in secure regional data centers with AES-256 encryption at rest and in transit.
              </li>
              <li className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4DE]">
                <strong className="text-[#171717]">Razorpay Software Private Limited</strong> (PCI-DSS Level 1 Certified Payment Processing): Tokenized payment handling for UPI, netbanking, and debit cards in India.
              </li>
              <li className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4DE]">
                <strong className="text-[#171717]">Render Services Inc. & Cloudflare Inc.</strong> (Application Backend & Edge CDN Delivery): High-availability microservice processing and DDoS mitigation.
              </li>
            </ul>
          </section>

          {/* Section 6 - User Rights & Account Deletion */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">6. Your Rights: Data Access & Right to Erasure</h2>
            <p className="mb-4">
              Under the DPDP Act 2023 and GDPR, you possess comprehensive rights regarding your personal information:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4DE]">
                <strong className="text-[#171717] block mb-1">Right to Access & Portability</strong>
                <span>Download a machine-readable JSON/CSV package of all your stored rosters, invoices, and preferences at any time.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4DE]">
                <strong className="text-[#171717] block mb-1">Right to Erasure (Account Deletion)</strong>
                <span>Permanently purge your account, saved patterns, and company credentials from our production databases.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4DE]">
                <strong className="text-[#171717] block mb-1">Right to Rectification</strong>
                <span>Instantly update incorrect business names, contact persons, or phone numbers in your workspace settings.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E4DE]">
                <strong className="text-[#171717] block mb-1">Right to Withdraw Marketing Consent</strong>
                <span>Unsubscribe from promotional emails or WhatsApp updates with a single click.</span>
              </div>
            </div>

            <Link
              to="/data-request"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E4572E] text-white font-bold text-xs hover:bg-[#D4431B] transition-colors shadow-sm"
            >
              <UserCheck size={14} />
              Open Data Privacy & Account Deletion Portal
            </Link>
          </section>

          {/* Section 7 - Children's Privacy */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">7. Protection of Children&apos;s Data</h2>
            <p>
              FiveNest is exclusively a commercial B2B sportswear manufacturing and graphic automation tool designed for corporate enterprises, registered apparel factories, and individual proprietors aged <strong>18 years or older</strong>. We do not solicit or knowingly collect personal data from minors. If you believe a minor has created an account, please alert our Grievance Officer immediately for prompt removal.
            </p>
          </section>

          {/* Section 8 - Grievance Redressal */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E4DE]">
            <h2 className="text-xl font-bold text-[#171717] mb-3">8. Grievance Officer & Contact Information</h2>
            <p className="mb-4">
              In accordance with the Information Technology Act, 2000 and the DPDP Act, 2023, the details of our designated Data Protection & Grievance Officer are:
            </p>
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DE] text-xs space-y-2">
              <p><strong>Designated Officer:</strong> Vilesh Gund (Data Protection Officer, FiveNest India)</p>
              <p><strong>Email Address:</strong> <a href="mailto:fivenest.india@gmail.com" className="text-[#E4572E] font-bold">fivenest.india@gmail.com</a></p>
              <p><strong>Support & WhatsApp Helpline:</strong> +91 88792 28710</p>
              <p><strong>Postal Address:</strong> Mahim, Mumbai, Maharashtra 400016, India</p>
              <p><strong>Resolution SLA:</strong> We acknowledge data privacy requests within 24 hours and resolve inquiries within 7 business days.</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
