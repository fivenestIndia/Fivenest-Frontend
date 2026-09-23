// ─── Shared Company Profile & Indian Billing Helpers ──────────────────────────
// Provides company identity, bank payment details, GST info, terms, and
// number-to-words Indian currency converter for professional invoices.
// ─────────────────────────────────────────────────────────────────────────────

export interface CompanyProfile {
  companyName: string;
  tagline: string;
  address: string;
  cityStatePin: string;
  phone: string;
  email: string;
  gstin: string;
  state?: string;
  stateCode?: string;
  // Bank & UPI payment details for invoices
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  upiId?: string;
  // Legal terms on invoice
  terms?: string;
}

export const DEFAULT_COMPANY: CompanyProfile = {
  companyName: 'FiveNest Apparels',
  tagline: 'Sportswear & Sublimation Printing Studio',
  address: 'Textile Industrial Hub',
  cityStatePin: 'Maharashtra, India',
  phone: '+91 96640 90039',
  email: 'orders@fivenest.in',
  gstin: '',
  state: 'Maharashtra',
  stateCode: '27',
  bankName: 'HDFC Bank',
  accountNumber: '',
  ifscCode: '',
  accountHolder: 'FiveNest Apparels',
  upiId: '',
  terms: '1. Goods once sold will not be taken back.\n2. 50% advance with order, balance on delivery.\n3. All disputes subject to local jurisdiction.',
};

export const COMPANY_PROFILE_STORAGE_KEY = 'fn_company_profile';

export function getCompanyProfile(): CompanyProfile {
  try {
    const saved = localStorage.getItem(COMPANY_PROFILE_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_COMPANY, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load company profile:', e);
  }
  return DEFAULT_COMPANY;
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  try {
    localStorage.setItem(COMPANY_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save company profile:', e);
  }
}

/**
 * Converts a numeric amount into Indian Currency Words.
 * e.g., 12500 -> "Rupees Twelve Thousand Five Hundred Only"
 */
export function numberToWordsIndian(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Rupees Zero Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + (a[n % 10] ? a[n % 10] + ' ' : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  }

  const rounded = Math.round(num);
  const words = inWords(rounded).trim().replace(/\s+/g, ' ');
  return 'Rupees ' + words + ' Only';
}
