/**
 * FiveNest Design Studio - Subscription & Recharge Plans
 * Configured per official FiveNest Pricing Structure
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'spot' | 'monthly' | 'quarterly';
  upfront: number;           // Upfront amount charged in INR
  validityDays: number;      // Days valid (0 = per job)
  validityLabel: string;     // e.g. "Per job", "30 days", "90 days"
  rateWithTag: number;       // Per-jersey rate with FiveNest label tag (INR)
  jerseysWithTag: string | number; // Quantity included or "As required"
  rateWithoutTag: number;    // Per-jersey rate without tag (INR)
  jerseysWithoutTag: string | number; // Quantity included or "As required"
  hasOrderPortalAccess: boolean; // Order portal access included (plans >= ₹2,500)
  isPopular?: boolean;       // Highlighting for UI
  tagline: string;
  features: string[];
}

export const DEFAULT_SPOT_RATE_WITH_TAG = 3.50;
export const DEFAULT_SPOT_RATE_WITHOUT_TAG = 5.50;
export const ORDER_PORTAL_MIN_PLAN_AMOUNT = 2500;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // ── ON-THE-SPOT (Pay As You Go) ─────────────────────────────────────────
  {
    id: 'on_the_spot',
    name: 'On-the-spot',
    type: 'spot',
    upfront: 0,
    validityDays: 0,
    validityLabel: 'Per job',
    rateWithTag: 3.50,
    jerseysWithTag: 'As required',
    rateWithoutTag: 5.50,
    jerseysWithoutTag: 'As required',
    hasOrderPortalAccess: false,
    tagline: 'Zero commitment — pay only when you export high-res prints',
    features: [
      'Pay exact job cost on export',
      '₹3.50/pc with FiveNest tag (₹5.50 without)',
      'Front & sleeve panels always FREE',
      'No monthly commitment or balance lock'
    ]
  },

  // ── MONTHLY PLANS (30 Days Validity) ────────────────────────────────────
  {
    id: 'monthly_starter',
    name: 'Monthly Starter',
    type: 'monthly',
    upfront: 1000,
    validityDays: 30,
    validityLabel: '30 days',
    rateWithTag: 3.00,
    jerseysWithTag: 333,
    rateWithoutTag: 5.00,
    jerseysWithoutTag: 200,
    hasOrderPortalAccess: false, // Below ₹2,500
    tagline: 'Ideal for emerging jersey shops and boutique custom print jobs',
    features: [
      '₹1,000 added to wallet balance',
      '30 days validity',
      '₹3.00/pc with tag (~333 jerseys)',
      '₹5.00/pc without tag (~200 jerseys)',
      '14% savings on standard rate'
    ]
  },
  {
    id: 'monthly_growth',
    name: 'Monthly Growth',
    type: 'monthly',
    upfront: 2500,
    validityDays: 30,
    validityLabel: '30 days',
    rateWithTag: 2.75,
    jerseysWithTag: 909,
    rateWithoutTag: 4.50,
    jerseysWithoutTag: 555,
    hasOrderPortalAccess: true, // ₹2,500+ -> Includes Order Portal
    isPopular: true,
    tagline: 'Most Popular: Serious savings + Full Order Portal Access',
    features: [
      '₹2,500 added to wallet balance',
      '30 days validity',
      '₹2.75/pc with tag (~909 jerseys)',
      '₹4.50/pc without tag (~555 jerseys)',
      '🔥 FULL ORDER MANAGEMENT PORTAL ACCESS',
      'Factory Ledgers, Job Sheets & Order Tracking',
      '21% savings on standard rate'
    ]
  },
  {
    id: 'monthly_pro',
    name: 'Monthly Pro',
    type: 'monthly',
    upfront: 5000,
    validityDays: 30,
    validityLabel: '30 days',
    rateWithTag: 2.50,
    jerseysWithTag: 2000,
    rateWithoutTag: 4.00,
    jerseysWithoutTag: 1250,
    hasOrderPortalAccess: true,
    tagline: 'High volume production with industry-leading per-piece margins',
    features: [
      '₹5,000 added to wallet balance',
      '30 days validity',
      '₹2.50/pc with tag (~2,000 jerseys)',
      '₹4.00/pc without tag (~1,250 jerseys)',
      '🔥 FULL ORDER MANAGEMENT PORTAL ACCESS',
      'Priority rendering queue',
      '28% savings on standard rate'
    ]
  },
  {
    id: 'monthly_factory',
    name: 'Monthly Factory',
    type: 'monthly',
    upfront: 10000,
    validityDays: 30,
    validityLabel: '30 days',
    rateWithTag: 2.00,
    jerseysWithTag: 5000,
    rateWithoutTag: 3.00,
    jerseysWithoutTag: 3333,
    hasOrderPortalAccess: true,
    tagline: 'Maximum industrial scale for high-capacity manufacturing units',
    features: [
      '₹10,000 added to wallet balance',
      '30 days validity',
      '₹2.00/pc with tag (~5,000 jerseys)',
      '₹3.00/pc without tag (~3,333 jerseys)',
      '🔥 FULL ORDER MANAGEMENT PORTAL ACCESS',
      'Unlimited factory ledgers & reports',
      '43% savings — lowest rate guaranteed'
    ]
  },

  // ── QUARTERLY PLANS (90 Days Validity) ──────────────────────────────────
  {
    id: 'quarterly_starter',
    name: 'Quarterly Starter',
    type: 'quarterly',
    upfront: 2500,
    validityDays: 90,
    validityLabel: '90 days',
    rateWithTag: 2.85,
    jerseysWithTag: 877,
    rateWithoutTag: 4.60,
    jerseysWithoutTag: 543,
    hasOrderPortalAccess: true, // ₹2,500+ -> Includes Order Portal
    tagline: '3 months long validity with complete peace of mind',
    features: [
      '₹2,500 added to wallet balance',
      '90 days extended validity',
      '₹2.85/pc with tag (~877 jerseys)',
      '₹4.60/pc without tag (~543 jerseys)',
      '🔥 FULL ORDER MANAGEMENT PORTAL ACCESS',
      'Ideal for consistent quarterly production'
    ]
  },
  {
    id: 'quarterly_growth',
    name: 'Quarterly Growth',
    type: 'quarterly',
    upfront: 5000,
    validityDays: 90,
    validityLabel: '90 days',
    rateWithTag: 2.65,
    jerseysWithTag: 1886,
    rateWithoutTag: 4.25,
    jerseysWithoutTag: 1176,
    hasOrderPortalAccess: true,
    tagline: 'Steady quarterly volume at bulk discounted rates',
    features: [
      '₹5,000 added to wallet balance',
      '90 days extended validity',
      '₹2.65/pc with tag (~1,886 jerseys)',
      '₹4.25/pc without tag (~1,176 jerseys)',
      '🔥 FULL ORDER MANAGEMENT PORTAL ACCESS',
      'Factory order ledger & client billing'
    ]
  },
  {
    id: 'quarterly_pro',
    name: 'Quarterly Pro',
    type: 'quarterly',
    upfront: 10000,
    validityDays: 90,
    validityLabel: '90 days',
    rateWithTag: 2.50,
    jerseysWithTag: 4000,
    rateWithoutTag: 3.50,
    jerseysWithoutTag: 2857,
    hasOrderPortalAccess: true,
    tagline: 'Enterprise scale for 90 full days of uninterrupted manufacturing',
    features: [
      '₹10,000 added to wallet balance',
      '90 days extended validity',
      '₹2.50/pc with tag (~4,000 jerseys)',
      '₹3.50/pc without tag (~2,857 jerseys)',
      '🔥 FULL ORDER MANAGEMENT PORTAL ACCESS',
      'Dedicated support & maximum margin'
    ]
  }
];

export interface UserSubscriptionState {
  planId: string;
  planName: string;
  planAmount: number;
  rateWithTag: number;
  rateWithoutTag: number;
  purchasedAt: string;
  expiresAt: string;
  hasOrderAccess: boolean;
}

/**
 * Check if the active subscription is valid and unexpired
 */
export function isSubscriptionActive(sub: UserSubscriptionState | null | undefined): boolean {
  if (!sub || !sub.expiresAt) return false;
  try {
    return new Date(sub.expiresAt).getTime() > Date.now();
  } catch {
    return false;
  }
}

/**
 * Get active rate per jersey based on user subscription
 */
export function getUserJerseyRate(
  userSub: UserSubscriptionState | null | undefined,
  includeWatermarkLogo: boolean,
  isOwnerExempt = false
): number {
  if (isOwnerExempt) return 0;
  
  if (userSub && isSubscriptionActive(userSub)) {
    return includeWatermarkLogo ? userSub.rateWithTag : userSub.rateWithoutTag;
  }

  // Default On-the-spot rate
  return includeWatermarkLogo ? DEFAULT_SPOT_RATE_WITH_TAG : DEFAULT_SPOT_RATE_WITHOUT_TAG;
}

/**
 * Determine if a user has access to the Order Portal
 * Requirements:
 * 1. Admin/owner accounts always have full access
 * 2. Subscription plans >= ₹2,500 have access while active
 * 3. Plans below ₹2,500 (or on-the-spot) do NOT have access
 */
export function canAccessOrderPortal(
  user: { email?: string } | null | undefined,
  sub: UserSubscriptionState | null | undefined
): boolean {
  if (!user || !user.email) return false;

  const email = user.email.toLowerCase().trim();
  const WHITELISTED_ADMINS = [
    'fivenest.india@gmail.com',
    'vilesh332.1@gmail.com',
    'wavredeepika9@gmail.com'
  ];

  if (WHITELISTED_ADMINS.includes(email)) {
    return true;
  }

  if (sub && isSubscriptionActive(sub)) {
    return (sub.planAmount || 0) >= ORDER_PORTAL_MIN_PLAN_AMOUNT;
  }

  return false;
}

/**
 * Retrieve saved subscription from localStorage
 */
export function getSavedSubscription(): UserSubscriptionState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('fivenest_subscription');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isSubscriptionActive(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn("Failed to parse fivenest_subscription:", e);
  }
  return null;
}

/**
 * Save user subscription
 */
export function saveSubscription(sub: UserSubscriptionState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('fivenest_subscription', JSON.stringify(sub));
    window.dispatchEvent(new CustomEvent('fivenest_subscription_updated', { detail: sub }));
  } catch (e) {
    console.warn("Failed to save fivenest_subscription:", e);
  }
}
