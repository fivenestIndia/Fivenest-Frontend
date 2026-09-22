import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, AlertTriangle, CheckCircle, Search, Download, Plus, MessageSquare,
  Clock, IndianRupee, ShieldCheck
} from 'lucide-react';
import {
  useOrderStore, BusinessType, fmt, PAYMENT_MODE_LABELS, STATUS_COLORS, STATUS_LABELS
} from '../../hooks/useOrderStore';
import OutstandingView from './OutstandingView';

const cn = (...c: (string | undefined | boolean)[]) => c.filter(Boolean).join(' ');

interface Props {
  store: ReturnType<typeof useOrderStore>;
  mode: 'all' | BusinessType;
  onReceivePayment: (customerId?: string) => void;
  defaultTab?: 'outstanding' | 'history';
}

export default function PaymentsHub({ store, mode, onReceivePayment, defaultTab = 'outstanding' }: Props) {
  const [activeTab, setActiveTab] = useState<'outstanding' | 'history'>(defaultTab);
  const [searchHistory, setSearchHistory] = useState('');

  // Calculate totals
  const stats = store.getKPIStats(mode);
  const totalPaidCount = store.state.payments.length;

  // Filter payment history based on search and mode if applicable
  const filteredPayments = store.state.payments.filter(p => {
    const cust = store.state.customers.find(c => c.id === p.customerId);
    const q = searchHistory.toLowerCase();
    const matchSearch = !q ||
      p.paymentNumber.toLowerCase().includes(q) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
      (cust && (cust.businessName.toLowerCase().includes(q) || cust.name.toLowerCase().includes(q) || cust.phone.includes(q)));

    if (!matchSearch) return false;
    if (mode === 'all') return true;

    // Check if this payment had allocations for this mode
    return p.allocations.some(a => a.orderType === mode);
  });

  const handleExportCSV = () => {
    const rows = [
      ['Receipt #', 'Customer', 'Date', 'Amount', 'Mode', 'Reference', 'Notes'],
      ...filteredPayments.map(p => {
        const c = store.state.customers.find(x => x.id === p.customerId);
        return [
          p.paymentNumber,
          c?.businessName || c?.name || '',
          p.date,
          p.amount.toFixed(2),
          p.mode,
          p.referenceNumber || '',
          p.notes || '',
        ];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-history-${mode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* ── Top Header & Stats ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#171717] flex items-center gap-2">
            <CreditCard size={22} className="text-emerald-600" />
            Payments & Receivables
          </h2>
          <p className="text-xs text-[#71717A] mt-0.5">
            Track pending customer balances, overdue invoices, and payment receipts
          </p>
        </div>

        <button
          onClick={() => onReceivePayment()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-sm self-start sm:self-auto transition-all"
        >
          <Plus size={16} /> Receive Payment
        </button>
      </div>

      {/* ── Quick Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Outstanding Due</span>
            <AlertTriangle size={15} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-red-600">{fmt(stats.outstanding)}</p>
          <p className="text-[11px] text-[#71717A] mt-0.5">Pending collection</p>
        </div>

        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Overdue Amount</span>
            <Clock size={15} className="text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-700">{fmt(stats.overdue)}</p>
          <p className="text-[11px] text-red-600 font-semibold mt-0.5">Past due date</p>
        </div>

        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Total Received</span>
            <CheckCircle size={15} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{fmt(stats.received)}</p>
          <p className="text-[11px] text-[#71717A] mt-0.5">Total collected to date</p>
        </div>

        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#71717A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Receipts</span>
            <ShieldCheck size={15} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-[#171717]">{totalPaidCount}</p>
          <p className="text-[11px] text-[#71717A] mt-0.5">Payment entries recorded</p>
        </div>
      </div>

      {/* ── Segmented Tab Switcher (Outstanding vs Payment History) ── */}
      <div className="flex items-center justify-between border-b border-[#E8E4DE] pb-2">
        <div className="flex gap-2 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl p-1">
          <button
            onClick={() => setActiveTab('outstanding')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all',
              activeTab === 'outstanding'
                ? 'bg-white shadow-sm text-red-600'
                : 'text-[#71717A] hover:text-[#171717]'
            )}
          >
            <AlertTriangle size={15} />
            Outstanding Receivables
            {stats.outstanding > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black">
                {fmt(stats.outstanding)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all',
              activeTab === 'history'
                ? 'bg-white shadow-sm text-[#171717]'
                : 'text-[#71717A] hover:text-[#171717]'
            )}
          >
            <CreditCard size={15} />
            Payment History & Receipts
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
              {filteredPayments.length}
            </span>
          </button>
        </div>

        {activeTab === 'history' && filteredPayments.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E4DE] text-xs font-semibold text-[#52525B] hover:bg-white transition-colors"
          >
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>

      {/* ── Tab Contents ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'outstanding' ? (
          <motion.div
            key="outstanding"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <OutstandingView
              store={store}
              mode={mode}
              onReceivePayment={onReceivePayment}
            />
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {/* Search toolbar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input
                  value={searchHistory}
                  onChange={e => setSearchHistory(e.target.value)}
                  placeholder="Search receipt #, customer name, reference..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E4DE] text-xs sm:text-sm focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden shadow-sm">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-16">
                  <CreditCard size={36} className="mx-auto text-[#D8D5CF] mb-3" />
                  <p className="text-[#52525B] font-semibold">No Payment Receipts Found</p>
                  <p className="text-xs text-[#71717A] mt-1">
                    {searchHistory ? 'Try changing your search term.' : 'Record your first payment receipt.'}
                  </p>
                  <button
                    onClick={() => onReceivePayment()}
                    className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                  >
                    + Receive Payment
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E8E4DE]">
                      {['Receipt #', 'Customer', 'Date', 'Amount', 'Payment Mode', 'Reference #', 'Allocations', ''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[#71717A]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredPayments].reverse().map(p => {
                      const cust = store.state.customers.find(c => c.id === p.customerId);
                      return (
                        <tr key={p.id} className="border-t border-[#E8E4DE] hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-4 py-3 text-xs font-mono font-bold text-emerald-700">
                            {p.paymentNumber}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-sm text-[#171717]">{cust?.businessName || '—'}</p>
                            <p className="text-xs text-[#71717A]">{cust?.name}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#71717A] whitespace-nowrap">
                            {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 font-black text-sm text-emerald-600">
                            {fmt(p.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF8F5] border border-[#E8E4DE] uppercase text-[#52525B]">
                              {PAYMENT_MODE_LABELS[p.mode] || p.mode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#71717A] font-mono">
                            {p.referenceNumber || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#52525B]">
                            {p.allocations && p.allocations.length > 0 ? (
                              <div className="space-y-0.5">
                                {p.allocations.map((a, i) => (
                                  <span key={i} className="inline-block mr-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono">
                                    {a.orderType[0].toUpperCase()}: {fmt(a.amount)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              'Unallocated / Direct'
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {cust && (
                              <button
                                onClick={() => {
                                  const text = `Payment Receipt: Received ${fmt(p.amount)} via ${PAYMENT_MODE_LABELS[p.mode]} on ${p.date}. Receipt #${p.paymentNumber}. Thank you! — FiveNest`;
                                  window.open(`https://wa.me/91${cust.whatsapp || cust.phone}?text=${encodeURIComponent(text)}`, '_blank');
                                }}
                                title="Share Receipt on WhatsApp"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <MessageSquare size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
