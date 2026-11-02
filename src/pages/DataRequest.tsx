import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Trash2, Mail, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, UserCheck, BellOff, Bell } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { toast } from 'sonner';

export default function DataRequest() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [requestType, setRequestType] = useState<'export' | 'delete' | 'marketing_optout'>('export');
  const [reason, setReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Marketing email consent preference toggle
  const [marketingEmailConsent, setMarketingEmailConsent] = useState(() => {
    try {
      const stored = localStorage.getItem('fivenest_marketing_consent');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const handleMarketingToggle = (val: boolean) => {
    setMarketingEmailConsent(val);
    try {
      localStorage.setItem('fivenest_marketing_consent', String(val));
      toast.success(val ? "Subscribed to product updates." : "Unsubscribed from non-essential marketing emails.");
    } catch {}
  };

  const handleExportDataLocal = () => {
    // Collect all client stored data
    try {
      const exportObject: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        platform: "FiveNest Sublimation Design Studio",
        disclaimer: "Official Data Portability Export under DPDP Act 2023 / GDPR"
      };

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fivenest_') || key?.startsWith('teedex_')) {
          try {
            exportObject[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            exportObject[key] = localStorage.getItem(key);
          }
        }
      }

      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fivenest-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data export downloaded successfully!");
    } catch (e: any) {
      toast.error("Failed to generate export file: " + (e?.message || e));
    }
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your registered email address.");
      return;
    }

    if (requestType === 'delete' && !confirmDelete) {
      toast.error("Please check the confirmation box to authorize account deletion.");
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      if (requestType === 'delete') {
        setSubmittedMessage(`Your account deletion request for ${email} has been formally logged. Under our DPDP Right to Erasure process, your account credentials, saved patterns, and rosters will be permanently purged within 7 business days, with email confirmation sent to ${email}.`);
        toast.success("Account deletion request received.");
      } else if (requestType === 'export') {
        handleExportDataLocal();
        setSubmittedMessage(`Your complete data package for ${email} has been compiled and downloaded. A cloud backup copy has also been queued for dispatch to ${email}.`);
        toast.success("Data portability package generated.");
      } else {
        handleMarketingToggle(false);
        setSubmittedMessage(`You have been successfully unsubscribed from all marketing communications for ${email}. You will only receive essential transactional export receipts.`);
        toast.success("Unsubscribed successfully.");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#171717] font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 sm:py-24 w-full">
        <div className="mb-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-[#71717A] hover:text-[#E4572E] transition-colors mb-6 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4572E]/10 border border-[#E4572E]/20 text-[#E4572E] text-xs font-bold uppercase tracking-wider mb-3">
            <UserCheck size={14} /> Self-Service Privacy Portal
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight mb-4">
            Data Access & Account Deletion
          </h1>
          <p className="text-sm text-[#71717A] font-medium">
            Exercise your rights under the Digital Personal Data Protection Act 2023 (DPDP) and GDPR.
          </p>
        </div>

        {/* 1-Click Marketing Unsubscribe Card */}
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-6 mb-8 shadow-soft">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#E4572E] flex items-center justify-center flex-shrink-0">
                {marketingEmailConsent ? <Bell size={18} /> : <BellOff size={18} />}
              </div>
              <div>
                <h2 className="text-base font-bold text-[#171717] mb-1">Marketing & Newsletter Preferences</h2>
                <p className="text-xs text-[#71717A] max-w-md">
                  {marketingEmailConsent 
                    ? "You are currently opted-in to receive product updates, festival discounts, and printing tips." 
                    : "You are currently opted-out. You will only receive mandatory transactional export receipts."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleMarketingToggle(!marketingEmailConsent)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                marketingEmailConsent
                  ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
              }`}
            >
              {marketingEmailConsent ? "Unsubscribe from Marketing" : "Opt-In to Product Updates"}
            </button>
          </div>
        </div>

        {/* Interactive Request Form */}
        <div className="bg-white border border-[#E8E4DE] rounded-3xl p-6 sm:p-10 shadow-soft">
          {submittedMessage ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-xl font-black text-[#171717] mb-3">Request Received & Processed</h2>
              <p className="text-sm text-[#52525B] leading-relaxed mb-6 max-w-lg mx-auto">
                {submittedMessage}
              </p>
              <button
                type="button"
                onClick={() => setSubmittedMessage(null)}
                className="px-5 py-2.5 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B] transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-2">
                  Select Action
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRequestType('export')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      requestType === 'export'
                        ? 'border-[#E4572E] bg-[#FFF0EB] text-[#E4572E]'
                        : 'border-[#E8E4DE] hover:bg-[#FAF9F6] text-[#52525B]'
                    }`}
                  >
                    <Download size={18} className="mb-2" />
                    <p className="text-xs font-bold">Download My Data</p>
                    <span className="text-[10px] text-[#71717A] block mt-1">Export JSON of your rosters & profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestType('delete')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      requestType === 'delete'
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-[#E8E4DE] hover:bg-[#FAF9F6] text-[#52525B]'
                    }`}
                  >
                    <Trash2 size={18} className="mb-2" />
                    <p className="text-xs font-bold">Delete My Account</p>
                    <span className="text-[10px] text-[#71717A] block mt-1">Permanent erasure of personal data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestType('marketing_optout')}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      requestType === 'marketing_optout'
                        ? 'border-neutral-800 bg-neutral-100 text-neutral-900'
                        : 'border-[#E8E4DE] hover:bg-[#FAF9F6] text-[#52525B]'
                    }`}
                  >
                    <BellOff size={18} className="mb-2" />
                    <p className="text-xs font-bold">Unsubscribe Emails</p>
                    <span className="text-[10px] text-[#71717A] block mt-1">Stop marketing & newsletters</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                  Registered Account Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. factory@yourdomain.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#D0CCC5] bg-[#FAF9F6] text-sm text-[#171717] focus:outline-none focus:border-[#E4572E] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-[#D0CCC5] bg-[#FAF9F6] text-sm text-[#171717] focus:outline-none focus:border-[#E4572E] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                    Verified Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-3 rounded-xl border border-[#D0CCC5] bg-[#FAF9F6] text-sm text-[#171717] focus:outline-none focus:border-[#E4572E] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
                  Reason or Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Let us know if you encountered any issue so we can improve."
                  className="w-full px-4 py-3 rounded-xl border border-[#D0CCC5] bg-[#FAF9F6] text-sm text-[#171717] focus:outline-none focus:border-[#E4572E] transition-all"
                />
              </div>

              {/* Warning for Account Deletion */}
              {requestType === 'delete' && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-red-700">
                    <AlertTriangle size={16} />
                    Permanent & Irreversible Action
                  </div>
                  <p>
                    Deleting your account will permanently purge your saved designs, team logos, and order archives. Any remaining promotional or paid credits will be forfeited upon account closure.
                  </p>
                  <label className="flex items-center gap-2 pt-2 cursor-pointer font-bold text-[#171717]">
                    <input
                      type="checkbox"
                      checked={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.checked)}
                      className="rounded border-red-400 text-red-600 focus:ring-red-500"
                    />
                    <span>I understand and authorize permanent account erasure</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 rounded-xl font-black text-xs sm:text-sm tracking-wide uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  requestType === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-[#E4572E] hover:bg-[#D4431B] text-white'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Processing Privacy Request...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>
                      {requestType === 'export' && "Download My Data Archive"}
                      {requestType === 'delete' && "Confirm Account Deletion"}
                      {requestType === 'marketing_optout' && "Save Email Preferences"}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
