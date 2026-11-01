import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, CheckCircle2, Clock, ShieldCheck, AlertCircle, 
  ArrowRight, Phone, Building2, User, MapPin, FileCheck, Check, MessageSquare
} from 'lucide-react';
import { 
  getTrialStatus, applyForTrial, TrialClaimRecord, TrialStage 
} from '../../lib/trialManager';

interface TrialOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email: string; name: string; balance: number; id?: string } | null;
  onOpenLogin: () => void;
  onClaimSuccess?: () => void;
}

export default function TrialOfferModal({
  isOpen,
  onClose,
  currentUser,
  onOpenLogin,
  onClaimSuccess
}: TrialOfferModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [claim, setClaim] = useState<TrialClaimRecord | null>(null);
  const [stage, setStage] = useState<TrialStage>('not_applied');
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(currentUser?.name || '');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gstin, setGstin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch trial status on open or user change
  useEffect(() => {
    if (!isOpen) return;

    if (!currentUser) {
      setStage('not_applied');
      return;
    }

    setFetchLoading(true);
    getTrialStatus(currentUser.email, currentUser.id).then((res) => {
      setStage(res.stage);
      setClaim(res.claim);
      setDaysRemaining(res.daysRemaining);
      if (res.claim) {
        setBusinessName(res.claim.businessName || '');
        setOwnerName(res.claim.ownerName || currentUser.name || '');
        setMobile(res.claim.mobile || '');
        setCity(res.claim.city || '');
        setState(res.claim.state || '');
        setGstin(res.claim.gstin || '');
      }
      setFetchLoading(false);
    });
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentUser) {
      onOpenLogin();
      return;
    }

    if (!businessName.trim() || !ownerName.trim() || !mobile.trim()) {
      setErrorMsg('Please enter your business name, contact name, and mobile number.');
      return;
    }

    const cleanDigits = mobile.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await applyForTrial({
        userId: currentUser.id,
        userEmail: currentUser.email,
        businessName,
        ownerName,
        mobile,
        city,
        state,
        gstin
      });

      if (res.success && res.claim) {
        setClaim(res.claim);
        setStage(res.claim.stage);
        setSuccessMsg(res.message || 'Application submitted successfully!');
        if (onClaimSuccess) onClaimSuccess();
      } else {
        setErrorMsg(res.error || 'Failed to submit application. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error submitting application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#0D0D15] border border-orange-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4572E]/15 border border-[#E4572E]/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles size={14} className="animate-pulse" />
          <span>Exclusive New Business Offer</span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Get Up to ₹500 in Free Production Credits
        </h2>

        {/* Official User-Specified Wording */}
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6">
          Available to eligible new businesses after verification and approval. Valid for 14 days from activation. One offer per business. No automatic charges.
        </p>

        {/* 3-Stage Process Visual Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          
          {/* Stage 1: Signup */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            stage === 'not_applied' 
              ? 'bg-neutral-900 border-neutral-700' 
              : 'bg-emerald-950/40 border-emerald-500/40'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono text-neutral-400">STAGE 1</span>
              <span className="font-black text-white">₹0 Credit</span>
            </div>
            <p className="text-xs font-bold text-neutral-200">Signup & Sample Data</p>
            <p className="text-[11px] text-neutral-400 mt-1">Explore design studio, sample squad rosters & 3D previews.</p>
            <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> Complete
            </div>
          </div>

          {/* Stage 2: Admin approves business */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            stage === 'approved_stage1' || stage === 'active_full_trial'
              ? 'bg-orange-950/40 border-[#E4572E]'
              : stage === 'pending_review'
              ? 'bg-amber-950/30 border-amber-500/40'
              : 'bg-neutral-900/60 border-neutral-800'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono text-orange-400 font-bold">STAGE 2</span>
              <span className="font-black text-orange-400">₹100 Credit</span>
            </div>
            <p className="text-xs font-bold text-white">Admin Approves Business</p>
            <p className="text-[11px] text-neutral-400 mt-1">Verified mobile + basic business details. 14-day validity starts.</p>
            <div className="mt-2 text-[10px] font-mono">
              {stage === 'approved_stage1' || stage === 'active_full_trial' ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={12} /> ₹100 Credited
                </span>
              ) : stage === 'pending_review' ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock size={12} /> Under Admin Review
                </span>
              ) : (
                <span className="text-neutral-500">Awaiting Submission</span>
              )}
            </div>
          </div>

          {/* Stage 3: Onboarding confirmed */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            stage === 'active_full_trial'
              ? 'bg-emerald-950/40 border-emerald-500'
              : 'bg-neutral-900/60 border-neutral-800'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono text-blue-400 font-bold">STAGE 3</span>
              <span className="font-black text-blue-400">+₹400 Extra</span>
            </div>
            <p className="text-xs font-bold text-white">Genuine Usage Confirmed</p>
            <p className="text-[11px] text-neutral-400 mt-1">Brief onboarding call or admin review. Total ₹500 unlocked.</p>
            <div className="mt-2 text-[10px] font-mono">
              {stage === 'active_full_trial' ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={12} /> Full ₹500 Unlocked
                </span>
              ) : (
                <span className="text-neutral-500">Stage 2 Required</span>
              )}
            </div>
          </div>

        </div>

        {/* ── NOT LOGGED IN STATE ── */}
        {!currentUser && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
            <User size={32} className="mx-auto text-orange-400 mb-2" />
            <h4 className="text-base font-bold text-white mb-1">Sign In to Claim Your ₹500 Trial</h4>
            <p className="text-xs text-neutral-400 mb-4 max-w-md mx-auto">
              Please sign in with Google or your registered email to submit your business details for verification.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="px-6 py-2.5 rounded-xl bg-[#E4572E] text-white font-bold text-sm hover:bg-[#D4431B] transition-colors"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* ── ALREADY ACTIVE: FULL TRIAL (₹500) ── */}
        {currentUser && stage === 'active_full_trial' && claim && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-neutral-900 border border-emerald-500/50">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase">
                🌟 Full ₹500 Free Trial Active
              </span>
              <span className="text-xs font-mono text-emerald-300 font-bold">
                {daysRemaining} Days Remaining
              </span>
            </div>
            <p className="text-lg font-black text-white mb-1">
              {claim.businessName}
            </p>
            <p className="text-xs text-neutral-300 mb-4">
              Your promotional credit is active. Export high-res sublimation prints at standard rates (₹3.50 with tag / ₹5.50 standard).
            </p>
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono mb-4">
              <div>
                <span className="text-neutral-400 block text-[10px]">REMAINING PROMO BALANCE:</span>
                <span className="text-xl font-black text-emerald-400">₹{claim.promoBalance.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">TOTAL CREDITED:</span>
                <span className="text-xl font-black text-white">₹{claim.creditGranted.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#E4572E] text-white font-bold text-sm hover:bg-[#D4431B] transition-colors"
            >
              Start Exporting in Studio
            </button>
          </div>
        )}

        {/* ── ALREADY ACTIVE: STAGE 1 (₹100) ── */}
        {currentUser && stage === 'approved_stage1' && claim && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-950/60 to-neutral-900 border border-[#E4572E]/50">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full bg-[#E4572E]/20 text-orange-400 text-xs font-black uppercase">
                🎉 Stage 1 Active (₹100 Credited)
              </span>
              <span className="text-xs font-mono text-orange-300 font-bold">
                {daysRemaining} Days Remaining
              </span>
            </div>
            <p className="text-lg font-black text-white mb-1">
              {claim.businessName}
            </p>
            <p className="text-xs text-neutral-300 mb-3">
              Your first ₹100 credit is ready to use! Complete a brief 3-minute onboarding review to unlock the remaining ₹400 credit (Total ₹500).
            </p>
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono mb-4">
              <div>
                <span className="text-neutral-400 block text-[10px]">PROMO BALANCE:</span>
                <span className="text-xl font-black text-orange-400">₹{claim.promoBalance.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">STAGE 2 BONUS:</span>
                <span className="text-xl font-black text-blue-400">+₹400 Extra</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/919322616226?text=${encodeURIComponent(`Hi FiveNest team, I have activated Stage 1 for ${claim.businessName} (${claim.mobile}). I would like to complete onboarding to claim the extra ₹400 trial credits.`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 text-center"
              >
                <MessageSquare size={16} />
                <span>Claim Extra ₹400 via WhatsApp</span>
              </a>
              <button
                onClick={onClose}
                className="py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                Continue in Studio
              </button>
            </div>
          </div>
        )}

        {/* ── PENDING REVIEW STATE ── */}
        {currentUser && stage === 'pending_review' && claim && (
          <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/40">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-2">
              <Clock size={18} />
              <span>Application Under Review</span>
            </div>
            <p className="text-sm font-bold text-white mb-1">
              {claim.businessName}
            </p>
            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              Your business details have been received! Our admin team is verifying your profile. 
              Once approved, your initial <strong>₹100 trial credit</strong> will be automatically activated for 14 days.
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono space-y-1 mb-4 text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-400">Mobile:</span>
                <span>{claim.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Contact:</span>
                <span>{claim.ownerName}</span>
              </div>
              {claim.city && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Location:</span>
                  <span>{claim.city}, {claim.state}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              Explore Studio While Awaiting Approval
            </button>
          </div>
        )}

        {/* ── CLARIFICATION REQUESTED OR NOT APPLIED (FORM) ── */}
        {currentUser && (stage === 'not_applied' || stage === 'clarification_requested') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {stage === 'clarification_requested' && claim?.clarificationMessage && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500 text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Admin Note:</strong> {claim.clarificationMessage}
                  <p className="text-neutral-300 mt-1">Please update your details below and re-submit.</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs">
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs">
                ✓ {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Business / Factory Name *
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surat Sublimation Mills"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#E4572E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Contact Person / Owner *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#E4572E]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Mobile Number (WhatsApp) *
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#E4572E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  City / Textile Hub
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="e.g. Surat, Tirupur, Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#E4572E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  GSTIN / Proof (Optional)
                </label>
                <div className="relative">
                  <FileCheck size={16} className="absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="GSTIN (optional)"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#E4572E]"
                  />
                </div>
              </div>
            </div>

            {/* Terms Summary Note */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-neutral-400 space-y-1">
              <p>• <strong>14-day validity</strong> begins on approval, not signup.</p>
              <p>• Standard trial export rates: <strong>₹3.50 with tag / ₹5.50 without tag</strong>.</p>
              <p>• Promos are non-transferable and apply once per business workspace.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#E4572E] hover:bg-[#D4431B] text-white font-bold text-sm shadow-brand transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting Application...' : 'Submit Business for Approval (Get ₹100 + ₹400 Trial)'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
