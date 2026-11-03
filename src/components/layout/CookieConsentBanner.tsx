import React, { useState, useEffect } from 'react';
import { Shield, Cookie, X, Check, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CookieConsentState {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

const COOKIE_STORAGE_KEY = 'fivenest_cookie_consent_v1';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);

  // Preference state
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(false);
  const [marketingConsent, setMarketingConsent] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!saved) {
        // Show after a brief delay so page loads smoothly
        const timer = setTimeout(() => setShowBanner(true), 800);
        return () => clearTimeout(timer);
      } else {
        const parsed: CookieConsentState = JSON.parse(saved);
        setAnalyticsConsent(parsed.analytics);
        setMarketingConsent(parsed.marketing);
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  // Listen for manual trigger from Footer / Settings
  useEffect(() => {
    const handleOpen = () => {
      setShowPreferences(true);
      setShowBanner(true);
    };
    window.addEventListener('fivenest_open_cookie_preferences', handleOpen);
    return () => window.removeEventListener('fivenest_open_cookie_preferences', handleOpen);
  }, []);

  const saveConsent = (analytics: boolean, marketing: boolean) => {
    const state: CookieConsentState = {
      essential: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(state));
    } catch {}

    setAnalyticsConsent(analytics);
    setMarketingConsent(marketing);
    setShowBanner(false);
    setShowPreferences(false);

    // Apply tracker blocking logic
    if (typeof window !== 'undefined') {
      (window as any).fivenestConsent = state;
      window.dispatchEvent(new CustomEvent('fivenest_consent_updated', { detail: state }));
    }
  };

  const handleAcceptAll = () => {
    saveConsent(true, true);
  };

  const handleRejectNonEssential = () => {
    saveConsent(false, false);
  };

  const handleSaveCustom = () => {
    saveConsent(analyticsConsent, marketingConsent);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-[#171717]/95 backdrop-blur-md text-white rounded-2xl sm:rounded-3xl border border-white/15 p-5 sm:p-6 shadow-2xl pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
        {!showPreferences ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#FF7A50] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cookie size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Privacy & Cookie Preferences</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                    DPDP & GDPR Compliant
                  </span>
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
                  We use essential cookies to maintain your login session and secure your vector graphics. We do not use third-party tracking cookies or train AI on your customer jerseys. Read our{' '}
                  <Link to="/privacy" className="text-[#FF7A50] underline hover:text-white transition-colors">
                    Privacy Policy
                  </Link>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal size={13} />
                <span>Customize</span>
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-200 hover:text-white bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#E4572E] to-[#EA580C] hover:opacity-95 shadow-md shadow-[#E4572E]/25 transition-all cursor-pointer"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          /* Detailed Preferences Modal View */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#FF7A50]" />
                <h4 className="text-sm font-bold text-white">Customize Privacy Preferences</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="text-neutral-400 hover:text-white p-1"
                aria-label="Close preferences"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Category 1: Essential */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">Essential Cookies</span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Always On</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  Required for user authentication, wallet session sync, and secure rendering.
                </p>
              </div>

              {/* Category 2: Performance & Diagnostics */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">Performance Telemetry</span>
                  <input
                    type="checkbox"
                    checked={analyticsConsent}
                    onChange={(e) => setAnalyticsConsent(e.target.checked)}
                    className="rounded border-white/20 text-[#E4572E] focus:ring-[#E4572E] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  Anonymized render speed metrics to optimize RGB export performance.
                </p>
              </div>

              {/* Category 3: Product Communications */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">Product Updates</span>
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="rounded border-white/20 text-[#E4572E] focus:ring-[#E4572E] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  Discounts, season offers, and new template release announcements.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Reject All Non-Essential
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#E4572E] to-[#EA580C] hover:opacity-95 shadow-md transition-all"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
