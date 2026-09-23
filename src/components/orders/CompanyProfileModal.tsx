import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Landmark, FileText, Check } from 'lucide-react';
import { CompanyProfile, saveCompanyProfile } from '../../lib/companyProfile';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSave: (profile: CompanyProfile) => void;
}

export default function CompanyProfileModal({ isOpen, onClose, profile, onSave }: Props) {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [tab, setTab] = useState<'business' | 'bank' | 'terms'>('business');

  useEffect(() => {
    setFormData(profile);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof CompanyProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCompanyProfile(formData);
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#E8E4DE] flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E4DE] bg-[#FAF8F5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#E4572E] text-white flex items-center justify-center font-black text-sm">
              <Building2 size={16} />
            </span>
            <div>
              <h3 className="font-extrabold text-base text-[#171717]">Invoice Business Profile</h3>
              <p className="text-xs text-[#71717A]">Your factory & bank details printed on invoices</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#E8E4DE] text-[#71717A] hover:text-[#171717] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E8E4DE] bg-white px-6 pt-2 gap-2 shrink-0">
          {[
            { key: 'business', label: 'Business Details', icon: Building2 },
            { key: 'bank', label: 'Bank & UPI', icon: Landmark },
            { key: 'terms', label: 'Terms & Conditions', icon: FileText },
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key as typeof tab)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-[#E4572E] text-[#E4572E]'
                    : 'border-transparent text-[#71717A] hover:text-[#171717]'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {tab === 'business' && (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">Company / Factory Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={e => handleChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
                  placeholder="e.g. FiveNest Apparels"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">Business Tagline / Subtitle</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
                  placeholder="e.g. Sportswear & Jersey Manufacturing Studio"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">Factory / Workshop Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E] resize-none"
                  placeholder="e.g. Plot No. 42, Textile Industrial Hub, MIDC"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#171717] block mb-1">City, State & Pincode</label>
                  <input
                    type="text"
                    value={formData.cityStatePin}
                    onChange={e => handleChange('cityStatePin', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
                    placeholder="e.g. Mumbai, Maharashtra - 400017"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#171717] block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm font-mono focus:outline-none focus:border-[#E4572E]"
                    placeholder="e.g. 27ABCDE1234F1Z5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#171717] block mb-1">Official Mobile / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
                    placeholder="e.g. +91 96640 90039"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#171717] block mb-1">Official Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
                    placeholder="e.g. orders@fivenest.in"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'bank' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                Bank & UPI details will appear on every invoice so your customers can transfer payments or scan UPI directly.
              </div>

              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName || ''}
                  onChange={e => handleChange('bankName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
                  placeholder="e.g. HDFC Bank / State Bank of India"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={formData.accountHolder || ''}
                  onChange={e => handleChange('accountHolder', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
                  placeholder="e.g. FiveNest Apparels"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#171717] block mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber || ''}
                    onChange={e => handleChange('accountNumber', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm font-mono focus:outline-none focus:border-[#E4572E]"
                    placeholder="e.g. 50200012345678"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#171717] block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifscCode || ''}
                    onChange={e => handleChange('ifscCode', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm font-mono focus:outline-none focus:border-[#E4572E]"
                    placeholder="e.g. HDFC0001234"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">UPI ID (VPA / GPay / PhonePe)</label>
                <input
                  type="text"
                  value={formData.upiId || ''}
                  onChange={e => handleChange('upiId', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm font-mono focus:outline-none focus:border-[#E4572E]"
                  placeholder="e.g. 9664090039@upi or fivenest@okhdfcbank"
                />
              </div>
            </div>
          )}

          {tab === 'terms' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                Terms & Conditions are printed at the bottom of the invoice for legal compliance.
              </div>

              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">Terms & Conditions (one per line)</label>
                <textarea
                  rows={6}
                  value={formData.terms || ''}
                  onChange={e => handleChange('terms', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-xs font-mono focus:outline-none focus:border-[#E4572E] resize-none leading-relaxed"
                  placeholder="1. Goods once sold will not be returned.&#10;2. 50% advance with order, balance on delivery.&#10;3. All disputes subject to local jurisdiction."
                />
              </div>
            </div>
          )}

          {/* Footer Save Button */}
          <div className="pt-4 border-t border-[#E8E4DE] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E8E4DE] text-xs font-bold text-[#52525B] hover:bg-[#F5F3EF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B] shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              Save Profile
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
