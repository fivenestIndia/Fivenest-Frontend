/**
 * FiveNest Design Studio - Free Trial Offer Manager (₹500 Promotion)
 * 
 * Rules:
 * - Stage 1 (Signup): ₹0 (explore sample data and 3D previews)
 * - Stage 2 (Admin approves business): ₹100 credit (Verified mobile + business details, 14-day validity starts)
 * - Stage 3 (Genuine usage confirmed): ₹400 extra credit (Brief onboarding call or admin review)
 * - Total trial offer: ₹500 once per business workspace
 * - Standard export rates apply: ₹3.50 with tag / ₹5.50 without tag
 * - Unused promotional credit expires 14 days after activation
 */

import { supabase } from './supabaseClient';

export type TrialStage = 
  | 'not_applied'
  | 'pending_review'
  | 'clarification_requested'
  | 'approved_stage1'
  | 'active_full_trial'
  | 'rejected'
  | 'expired';

export interface TrialDecisionHistory {
  adminEmail: string;
  action: string;
  amount?: number;
  note?: string;
  timestamp: string;
}

export interface TrialClaimRecord {
  id: string;
  userId?: string;
  userEmail: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  city?: string;
  state?: string;
  gstin?: string;
  stage: TrialStage;
  creditGranted: number; // 0, 100, 500
  creditUsed: number;
  promoBalance: number;
  activatedAt?: string;
  expiresAt?: string;
  ordersPortalTrial: boolean;
  clarificationMessage?: string;
  rejectionReason?: string;
  onboardingNotes?: string;
  decisionHistory: TrialDecisionHistory[];
  flags?: {
    phoneMatch: boolean;
    businessMatch: boolean;
    ipMatch: boolean;
    matchedRecords?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fivenest-backend.onrender.com';
const LOCAL_STORAGE_KEY = 'fivenest_trial_claim_active';
const LOCAL_CLAIMS_LIST_KEY = 'fivenest_all_trial_claims';

/**
 * Retrieve saved trial claim from local cache
 */
export function getSavedTrialClaim(): TrialClaimRecord | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Helper: Normalize mobile number
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned.slice(2);
  if (cleaned.length === 11 && cleaned.startsWith('0')) return cleaned.slice(1);
  return cleaned;
}

/**
 * Fetch current user's trial offer status
 */
export async function getTrialStatus(userEmail?: string, userId?: string): Promise<{
  hasApplied: boolean;
  stage: TrialStage;
  claim: TrialClaimRecord | null;
  daysRemaining: number;
  isActive: boolean;
}> {
  if (!userEmail && !userId) {
    return {
      hasApplied: false,
      stage: 'not_applied',
      claim: null,
      daysRemaining: 0,
      isActive: false
    };
  }

  const cleanEmail = (userEmail || '').toLowerCase().trim();

  // 1. Try Backend API first
  try {
    const url = `${API_BASE_URL}/api/trial/status?${cleanEmail ? `userEmail=${encodeURIComponent(cleanEmail)}` : `userId=${encodeURIComponent(userId || '')}`}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.claim) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.claim));
        return {
          hasApplied: data.hasApplied,
          stage: data.claim.stage,
          claim: data.claim,
          daysRemaining: data.daysRemaining || 0,
          isActive: data.isActive
        };
      }
    }
  } catch (err) {
    console.warn("Backend trial check failed, checking local cache:", err);
  }

  // 2. Local cache fallback
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed: TrialClaimRecord = JSON.parse(cached);
      if (parsed.userEmail.toLowerCase().trim() === cleanEmail) {
        // Calculate days remaining
        let days = 0;
        let isExpired = false;
        if (parsed.expiresAt) {
          const diffMs = new Date(parsed.expiresAt).getTime() - Date.now();
          days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          if (Date.now() > new Date(parsed.expiresAt).getTime()) {
            isExpired = true;
            parsed.stage = 'expired';
            parsed.promoBalance = 0;
          }
        }

        const active = (parsed.stage === 'approved_stage1' || parsed.stage === 'active_full_trial') && !isExpired;
        return {
          hasApplied: true,
          stage: parsed.stage,
          claim: parsed,
          daysRemaining: days,
          isActive: active
        };
      }
    }
  } catch (e) {}

  return {
    hasApplied: false,
    stage: 'not_applied',
    claim: null,
    daysRemaining: 0,
    isActive: false
  };
}

/**
 * Submit application for ₹500 Free Trial Offer
 */
export async function applyForTrial(params: {
  userId?: string;
  userEmail: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  city?: string;
  state?: string;
  gstin?: string;
}): Promise<{ success: boolean; claim?: TrialClaimRecord; message?: string; error?: string }> {
  const cleanEmail = params.userEmail.toLowerCase().trim();

  // Try backend first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${API_BASE_URL}/api/trial/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.claim) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.claim));
        return { success: true, claim: data.claim, message: data.message };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      const rawError = String(errData?.error || '');
      // Only return client-blocking error if it's a validation error (400)
      if (res.status === 400 && rawError && !rawError.includes('buffering timed out')) {
        return { success: false, error: rawError };
      }
      console.warn("Backend trial apply returned non-critical status:", res.status, rawError);
    }
  } catch (backendErr) {
    console.warn("Backend trial apply failed, saving locally:", backendErr);
  }

  // Fallback client-side record
  const fallbackClaim: TrialClaimRecord = {
    id: 'trial_' + Date.now(),
    userId: params.userId || '',
    userEmail: cleanEmail,
    businessName: params.businessName.trim(),
    ownerName: params.ownerName.trim(),
    mobile: params.mobile.trim(),
    city: params.city || '',
    state: params.state || '',
    gstin: params.gstin || '',
    stage: 'pending_review',
    creditGranted: 0,
    creditUsed: 0,
    promoBalance: 0,
    ordersPortalTrial: true,
    decisionHistory: [
      {
        adminEmail: 'System',
        action: 'application_submitted',
        amount: 0,
        note: `Submitted application for ${params.businessName}`,
        timestamp: new Date().toISOString()
      }
    ],
    flags: {
      phoneMatch: false,
      businessMatch: false,
      ipMatch: false
    },
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fallbackClaim));

  // Also save to all local claims list for admin inspection
  try {
    const rawList = localStorage.getItem(LOCAL_CLAIMS_LIST_KEY);
    const list: TrialClaimRecord[] = rawList ? JSON.parse(rawList) : [];
    const idx = list.findIndex(c => c.userEmail.toLowerCase() === cleanEmail);
    if (idx >= 0) list[idx] = fallbackClaim;
    else list.unshift(fallbackClaim);
    localStorage.setItem(LOCAL_CLAIMS_LIST_KEY, JSON.stringify(list));
  } catch (e) {}

  return {
    success: true,
    claim: fallbackClaim,
    message: "Application submitted! Once approved by admin, ₹100 credit will be added immediately (valid for 14 days)."
  };
}

/**
 * Deduct promotional credits for an export
 */
export async function deductPromoBalance(userEmail: string, amount: number, description?: string): Promise<{ success: boolean; deducted: number; remainingPromo: number }> {
  const cleanEmail = userEmail.toLowerCase().trim();

  // Try backend
  try {
    const res = await fetch(`${API_BASE_URL}/api/trial/deduct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: cleanEmail, amount, description })
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, deducted: data.deducted, remainingPromo: data.remainingPromoBalance };
    }
  } catch (e) {}

  // Fallback local update
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const claim: TrialClaimRecord = JSON.parse(cached);
      if (claim.userEmail.toLowerCase() === cleanEmail) {
        const deductAmt = Math.min(claim.promoBalance, amount);
        claim.promoBalance = Number((claim.promoBalance - deductAmt).toFixed(2));
        claim.creditUsed = Number((claim.creditUsed + deductAmt).toFixed(2));
        claim.decisionHistory.push({
          adminEmail: 'System',
          action: 'promo_export_deduction',
          amount: deductAmt,
          note: description || `Export deduction: ₹${deductAmt.toFixed(2)}`,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(claim));
        return { success: true, deducted: deductAmt, remainingPromo: claim.promoBalance };
      }
    }
  } catch (e) {}

  return { success: false, deducted: 0, remainingPromo: 0 };
}

/**
 * Admin: Fetch all trial claims
 */
export async function fetchAllTrialClaimsAdmin(adminEmail: string): Promise<{
  success: boolean;
  claims: TrialClaimRecord[];
  stats: {
    total: number;
    pending: number;
    stage1Approved: number;
    fullTrialActive: number;
    clarification: number;
    rejected: number;
    flaggedDuplicates: number;
    totalCreditDispatched: number;
    totalCreditUsed: number;
  };
}> {
  // 1. Try Backend
  try {
    const res = await fetch(`${API_BASE_URL}/api/trial/admin/all?adminEmail=${encodeURIComponent(adminEmail)}`, {
      headers: { 'x-admin-email': adminEmail }
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, claims: data.claims || [], stats: data.stats };
    }
  } catch (e) {
    console.warn("Failed to fetch admin trials from backend:", e);
  }

  // 2. Local fallback list
  try {
    const rawList = localStorage.getItem(LOCAL_CLAIMS_LIST_KEY);
    const claims: TrialClaimRecord[] = rawList ? JSON.parse(rawList) : [];
    
    const stats = {
      total: claims.length,
      pending: claims.filter(c => c.stage === 'pending_review').length,
      stage1Approved: claims.filter(c => c.stage === 'approved_stage1').length,
      fullTrialActive: claims.filter(c => c.stage === 'active_full_trial').length,
      clarification: claims.filter(c => c.stage === 'clarification_requested').length,
      rejected: claims.filter(c => c.stage === 'rejected').length,
      flaggedDuplicates: claims.filter(c => c.flags?.phoneMatch || c.flags?.businessMatch).length,
      totalCreditDispatched: claims.reduce((s, c) => s + (c.creditGranted || 0), 0),
      totalCreditUsed: claims.reduce((s, c) => s + (c.creditUsed || 0), 0)
    };

    return { success: true, claims, stats };
  } catch (e) {
    return {
      success: false,
      claims: [],
      stats: { total: 0, pending: 0, stage1Approved: 0, fullTrialActive: 0, clarification: 0, rejected: 0, flaggedDuplicates: 0, totalCreditDispatched: 0, totalCreditUsed: 0 }
    };
  }
}

/**
 * Admin: Submit decision on trial claim
 */
export async function submitAdminDecision(params: {
  adminEmail: string;
  claimId: string;
  action: 'approve_stage1' | 'approve_stage2_onboarding' | 'fast_track_full' | 'request_clarification' | 'reject';
  note?: string;
  customAmount?: number;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  // 1. Try Backend
  try {
    const res = await fetch(`${API_BASE_URL}/api/trial/admin/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': params.adminEmail
      },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message };
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.error) return { success: false, error: err.error };
    }
  } catch (e) {
    console.warn("Backend admin decision error, updating locally:", e);
  }

  // 2. Local fallback update
  try {
    const rawList = localStorage.getItem(LOCAL_CLAIMS_LIST_KEY);
    const list: TrialClaimRecord[] = rawList ? JSON.parse(rawList) : [];
    const claim = list.find(c => c.id === params.claimId);
    if (claim) {
      const now = new Date();
      const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

      if (params.action === 'approve_stage1') {
        const amt = params.customAmount || 100;
        claim.stage = 'approved_stage1';
        claim.creditGranted = amt;
        claim.promoBalance = amt;
        claim.activatedAt = now.toISOString();
        claim.expiresAt = fourteenDays;
      } else if (params.action === 'approve_stage2_onboarding') {
        const amt = params.customAmount || 400;
        claim.stage = 'active_full_trial';
        claim.creditGranted = (claim.creditGranted || 100) + amt;
        claim.promoBalance = Number(((claim.promoBalance || 0) + amt).toFixed(2));
      } else if (params.action === 'fast_track_full') {
        const amt = params.customAmount || 500;
        claim.stage = 'active_full_trial';
        claim.creditGranted = amt;
        claim.promoBalance = amt;
        claim.activatedAt = now.toISOString();
        claim.expiresAt = fourteenDays;
      } else if (params.action === 'request_clarification') {
        claim.stage = 'clarification_requested';
        claim.clarificationMessage = params.note || 'Please provide additional business details.';
      } else if (params.action === 'reject') {
        claim.stage = 'rejected';
        claim.rejectionReason = params.note || 'Ineligible for trial offer.';
      }

      claim.decisionHistory.push({
        adminEmail: params.adminEmail,
        action: params.action,
        note: params.note || '',
        timestamp: new Date().toISOString()
      });

      localStorage.setItem(LOCAL_CLAIMS_LIST_KEY, JSON.stringify(list));
      
      // If matches active claim
      const activeClaimRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (activeClaimRaw) {
        const active: TrialClaimRecord = JSON.parse(activeClaimRaw);
        if (active.id === claim.id) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(claim));
        }
      }

      return { success: true, message: `Action ${params.action} applied successfully.` };
    }
  } catch (e) {}

  return { success: false, error: 'Failed to apply admin decision.' };
}
