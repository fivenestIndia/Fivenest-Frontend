import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Printer, Filter, Search, ArrowUpRight, ArrowDownLeft,
  Calendar, CreditCard, Building2, TrendingUp, TrendingDown,
  FileSpreadsheet, CheckCircle2, ChevronRight
} from 'lucide-react';
import {
  useOrderStore,
  AllLedgerEntry,
  PaymentMode,
  fmt
} from '../../hooks/useOrderStore';

interface Props {
  store: ReturnType<typeof useOrderStore>;
  onReceivePayment?: () => void;
  onNewExpense?: () => void;
}

export default function MonthlyAllLedgerView({ store, onReceivePayment, onNewExpense }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');

  // All ledger transactions
  const allEntries = useMemo(() => {
    return store.getAllLedgerEntries();
  }, [store.state]);

  // Extract available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    allEntries.forEach(e => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.slice(0, 7));
      }
    });
    set.add(new Date().toISOString().slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [allEntries]);

  // Filtered transactions
  const filteredEntries = useMemo(() => {
    return allEntries.filter(e => {
      // Month
      if (selectedMonth !== 'all' && !(e.date || '').startsWith(selectedMonth)) {
        return false;
      }
      // Type
      if (typeFilter !== 'all' && e.type !== typeFilter) {
        return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = (e.title || '').toLowerCase().includes(q);
        const matchParty = (e.partyOrVendor || '').toLowerCase().includes(q);
        const matchRef = (e.referenceNumber || '').toLowerCase().includes(q);
        const matchCat = (e.category || '').toLowerCase().includes(q);
        const matchNotes = (e.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchParty && !matchRef && !matchCat && !matchNotes) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allEntries, selectedMonth, typeFilter, search]);

  // Financial summary for selected view
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredEntries.forEach(e => {
      income += e.credit;
      expense += e.debit;
    });
    const net = income - expense;
    const margin = income > 0 ? Math.round((net / income) * 100) : 0;
    return { income, expense, net, margin };
  }, [filteredEntries]);

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Reference #', 'Type', 'Description', 'Party / Vendor', 'Category', 'Mode', 'Credit (Income)', 'Debit (Expense)', 'Running Balance'],
      ...filteredEntries.map(e => [
        e.date,
        e.referenceNumber,
        e.type.toUpperCase(),
        e.title,
        e.partyOrVendor,
        e.category,
        (e.paymentMode || '').toUpperCase(),
        e.credit > 0 ? e.credit.toFixed(2) : '0.00',
        e.debit > 0 ? e.debit.toFixed(2) : '0.00',
        e.balance.toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fivenest-all-ledger-${selectedMonth === 'all' ? 'all-time' : selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ── Summary Cards (Income vs Expense vs Net Balance) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Total Inflow (Income)
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ArrowDownLeft size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600">+ {fmt(totals.income)}</p>
          <p className="text-[11px] text-[#71717A] mt-1">Payments collected from all orders</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Factory Expenses
            </span>
            <span className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
              <ArrowUpRight size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-red-600">- {fmt(totals.expense)}</p>
          <p className="text-[11px] text-[#71717A] mt-1">Light bills, rent, wages & supplies</p>
        </div>

        {/* Net Profit / Margin */}
        <div className={`rounded-2xl p-5 border shadow-xs ${
          totals.net >= 0 ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-red-50/70 border-red-200 text-red-950'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Net Margin (Cash Flow)
            </span>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              totals.net >= 0 ? 'bg-emerald-200/80 text-emerald-800' : 'bg-red-200/80 text-red-800'
            }`}>
              {totals.net >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </span>
          </div>
          <p className={`text-2xl font-black ${totals.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {totals.net >= 0 ? '+ ' : ''}{fmt(totals.net)}
          </p>
          <p className="text-[11px] font-semibold mt-1">
            Profit Margin: <strong>{totals.margin}%</strong>
          </p>
        </div>

        {/* Total Ledger Entries */}
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
              Total Transactions
            </span>
            <span className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold">
              <FileSpreadsheet size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-[#171717]">{filteredEntries.length}</p>
          <p className="text-[11px] text-[#71717A] mt-1">
            {selectedMonth === 'all' ? 'All Time Transactions' : `In ${selectedMonth}`}
          </p>
        </div>
      </div>

      {/* ── Filters & Action Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E4DE] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              placeholder="Search party, voucher, details..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl text-xs font-bold text-[#171717] focus:outline-none"
          >
            <option value="all">📅 All Months</option>
            {availableMonths.map(m => {
              const d = new Date(`${m}-01T00:00:00`);
              const label = !isNaN(d.getTime())
                ? d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                : m;
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E4DE]">
            {[
              { key: 'all', label: 'All Transactions' },
              { key: 'income', label: '🟢 Income Only' },
              { key: 'expense', label: '🔴 Expenses Only' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key as typeof typeFilter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === f.key
                    ? 'bg-white text-[#171717] shadow-xs'
                    : 'text-[#71717A] hover:text-[#171717]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Export & Print */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#52525B] hover:bg-[#FAF8F5] transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#52525B] hover:bg-[#FAF8F5] transition-all cursor-pointer"
          >
            <Printer size={14} />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* ── All Ledger Consolidated Table ── */}
      <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-[#E8E4DE] bg-[#FAF8F5] flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#171717]">
            Comprehensive Monthly Cashbook & Ledger ({filteredEntries.length} Records)
          </h3>
          <span className="text-xs font-bold text-[#71717A]">
            Showing Income (+) & Expenses (-) chronologically
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E4DE] bg-[#FAF8F5]/50 text-[11px] font-black uppercase tracking-wider text-[#71717A]">
                <th className="px-5 py-3.5">Date & Voucher #</th>
                <th className="px-5 py-3.5">Party / Vendor & Details</th>
                <th className="px-5 py-3.5">Category & Type</th>
                <th className="px-5 py-3.5">Payment Mode</th>
                <th className="px-5 py-3.5 text-right text-emerald-700">Credit (Inflow)</th>
                <th className="px-5 py-3.5 text-right text-red-600">Debit (Outflow)</th>
                <th className="px-5 py-3.5 text-right">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F3EF]">
              {filteredEntries.map(entry => {
                const isIncome = entry.type === 'income';

                return (
                  <tr key={entry.id} className="hover:bg-[#FAF8F5] transition-colors">
                    {/* Date & Ref */}
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-xs text-[#171717] block">
                        {entry.date ? new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                      <span className="font-mono text-[10px] text-[#71717A]">
                        {entry.referenceNumber}
                      </span>
                    </td>

                    {/* Party & Description */}
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-sm text-[#171717]">{entry.partyOrVendor}</p>
                      <p className="text-xs text-[#71717A] mt-0.5 truncate max-w-sm">
                        {entry.title}
                        {entry.notes && ` • ${entry.notes}`}
                      </p>
                    </td>

                    {/* Category Badge */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${entry.categoryBadgeClass}`}>
                        {entry.category}
                      </span>
                    </td>

                    {/* Payment Mode */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF8F5] border border-[#E8E4DE] text-[#52525B]">
                        {(entry.paymentMode || 'cash').toUpperCase()}
                      </span>
                    </td>

                    {/* Credit (Income) */}
                    <td className="px-5 py-3.5 text-right">
                      {isIncome ? (
                        <span className="font-black text-sm text-emerald-600">
                          + {fmt(entry.credit)}
                        </span>
                      ) : (
                        <span className="text-[#A1A1AA] text-xs">—</span>
                      )}
                    </td>

                    {/* Debit (Expense) */}
                    <td className="px-5 py-3.5 text-right">
                      {!isIncome ? (
                        <span className="font-black text-sm text-red-600">
                          - {fmt(entry.debit)}
                        </span>
                      ) : (
                        <span className="text-[#A1A1AA] text-xs">—</span>
                      )}
                    </td>

                    {/* Running Net Balance */}
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-black text-sm ${
                        entry.balance >= 0 ? 'text-[#171717]' : 'text-red-700'
                      }`}>
                        {fmt(entry.balance)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#71717A] text-sm">
                    No transactions found for the selected month and filter.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#E8E4DE] bg-[#FAF8F5] font-black text-sm">
                  <td colSpan={4} className="px-5 py-3.5 text-[#171717]">
                    Total ({filteredEntries.length} transactions)
                  </td>
                  <td className="px-5 py-3.5 text-right text-emerald-600">
                    + {fmt(totals.income)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-red-600">
                    - {fmt(totals.expense)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-[#171717]">
                    {fmt(totals.net)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
