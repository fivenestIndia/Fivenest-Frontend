import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Zap, Building2, Users, Scissors, Wrench, Truck, Coffee,
  PlusCircle, IndianRupee, Calendar, CreditCard, FileText, CheckCircle2
} from 'lucide-react';
import {
  useOrderStore,
  FactoryExpense,
  ExpenseCategory,
  PaymentMode,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS
} from '../../hooks/useOrderStore';

interface Props {
  store: ReturnType<typeof useOrderStore>;
  expenseToEdit?: FactoryExpense | null;
  onClose: () => void;
  onSaved: () => void;
}

const PRESETS: Array<{
  label: string;
  category: ExpenseCategory;
  defaultTitle: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  bg: string;
}> = [
  { label: 'Light Bill', category: 'electricity', defaultTitle: 'Electricity / Light Bill', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200' },
  { label: 'Factory Rent', category: 'rent', defaultTitle: 'Factory Unit Rent', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
  { label: 'Karigar Wages', category: 'salary', defaultTitle: 'Karigar & Tailor Wages', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
  { label: 'Ink & Paper', category: 'raw_material', defaultTitle: 'Sublimation Ink / Paper Rolls', icon: Scissors, color: 'text-orange-600', bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
  { label: 'Machine Repair', category: 'maintenance', defaultTitle: 'Plotter / Heat Press Service', icon: Wrench, color: 'text-rose-600', bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200' },
  { label: 'Delivery / Freight', category: 'logistics', defaultTitle: 'Tempo / Courier Transport', icon: Truck, color: 'text-sky-600', bg: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
  { label: 'Tea & Snacks', category: 'tea_snacks', defaultTitle: 'Daily Factory Tea & Refreshments', icon: Coffee, color: 'text-yellow-700', bg: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200' },
  { label: 'Custom / Other', category: 'other', defaultTitle: '', icon: PlusCircle, color: 'text-zinc-700', bg: 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300' },
];

export default function ExpenseModal({ store, expenseToEdit, onClose, onSaved }: Props) {
  const isEdit = !!expenseToEdit;

  const [title, setTitle] = useState(expenseToEdit?.title || '');
  const [category, setCategory] = useState<ExpenseCategory>(expenseToEdit?.category || 'electricity');
  const [customCategory, setCustomCategory] = useState(expenseToEdit?.customCategory || '');
  const [amount, setAmount] = useState<string>(expenseToEdit?.amount ? String(expenseToEdit.amount) : '');
  const [date, setDate] = useState(expenseToEdit?.date || new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(expenseToEdit?.paymentMode || 'upi');
  const [paidTo, setPaidTo] = useState(expenseToEdit?.paidTo || '');
  const [referenceNumber, setReferenceNumber] = useState(expenseToEdit?.referenceNumber || '');
  const [notes, setNotes] = useState(expenseToEdit?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setCategory(preset.category);
    if (!title || PRESETS.some(p => p.defaultTitle === title)) {
      setTitle(preset.defaultTitle);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide an expense title or description.');
      return;
    }

    if (isEdit && expenseToEdit) {
      store.dispatch({
        type: 'UPDATE_EXPENSE',
        payload: {
          ...expenseToEdit,
          title: title.trim(),
          category,
          customCategory: category === 'other' ? customCategory.trim() : undefined,
          amount: numAmount,
          date,
          paymentMode,
          paidTo: paidTo.trim() || undefined,
          referenceNumber: referenceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
    } else {
      store.dispatch({
        type: 'ADD_EXPENSE',
        payload: {
          title: title.trim(),
          category,
          customCategory: category === 'other' ? customCategory.trim() : undefined,
          amount: numAmount,
          date,
          paymentMode,
          paidTo: paidTo.trim() || undefined,
          referenceNumber: referenceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl border border-[#E8E4DE] w-full max-w-xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E4DE] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/25">
              <IndianRupee size={20} />
            </span>
            <div>
              <h3 className="text-base font-black text-[#171717]">
                {isEdit ? 'Edit Factory Expense' : 'Add Factory Expense'}
              </h3>
              <p className="text-xs text-[#71717A]">
                Record light bills, factory rent, worker wages, and operational costs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E8E4DE] flex items-center justify-center text-[#71717A] hover:text-[#171717] hover:bg-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <X size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets Carousel / Pills */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-[#71717A] block mb-2">
              ⚡ Quick Presets (1-Click Fill)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => {
                const Icon = p.icon;
                const isSelected = category === p.category;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#18181B] text-white border-[#18181B] shadow-xs scale-[1.02]'
                        : `${p.bg} ${p.color}`
                    }`}
                  >
                    <Icon size={13} className={isSelected ? 'text-white' : p.color} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Field (Large & Prominent) */}
          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E4DE]">
            <label className="text-xs font-black uppercase tracking-wider text-[#71717A] block mb-1">
              Expense Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-black text-[#171717]">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(null); }}
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-[#E8E4DE] text-2xl font-black text-[#171717] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Expense Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">
                Expense Title / Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Torrent Power Light Bill"
                value={title}
                onChange={e => { setTitle(e.target.value); setError(null); }}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#171717] focus:outline-none focus:border-[#E4572E] focus:ring-1 focus:ring-[#E4572E]/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">
                Expense Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#171717] focus:outline-none focus:border-[#E4572E] focus:ring-1 focus:ring-[#E4572E]/20"
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Category Input if 'other' */}
          {category === 'other' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-zinc-50 p-3 rounded-xl border border-zinc-200"
            >
              <label className="text-xs font-bold text-zinc-700 block mb-1">
                Custom Category Name (Add whatever you want)
              </label>
              <input
                type="text"
                placeholder="e.g. Packing Boxes, Canteen, Audit Fees"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-zinc-300 text-sm focus:outline-none focus:border-[#E4572E]"
              />
            </motion.div>
          )}

          {/* Date & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">
                Expense Date *
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#171717] focus:outline-none focus:border-[#E4572E]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">
                Payment Mode *
              </label>
              <div className="relative">
                <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#171717] focus:outline-none focus:border-[#E4572E]"
                >
                  {PAYMENT_MODES.map(m => (
                    <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Paid To & Reference / Bill No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">
                Paid To / Vendor / Worker Name
              </label>
              <input
                type="text"
                placeholder="e.g. Torrent Power / Landlord / Ramesh"
                value={paidTo}
                onChange={e => setPaidTo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#E8E4DE] text-sm text-[#171717] focus:outline-none focus:border-[#E4572E]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">
                Bill / Reference / UTR Number
              </label>
              <input
                type="text"
                placeholder="e.g. Bill #84920 or UPI UTR"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#E8E4DE] text-sm font-mono text-[#171717] focus:outline-none focus:border-[#E4572E]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-[#171717] block mb-1">
              Notes / Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Meter reading 45210, 5 units consumed..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-white rounded-xl border border-[#E8E4DE] text-sm text-[#171717] focus:outline-none focus:border-[#E4572E]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#E8E4DE] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#E8E4DE] text-sm font-bold text-[#71717A] hover:bg-[#FAF8F5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#E4572E] text-white text-sm font-black shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>{isEdit ? 'Update Expense' : 'Save Factory Expense'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
