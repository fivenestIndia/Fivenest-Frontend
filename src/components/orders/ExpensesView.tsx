import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Download, Trash2, Edit, Zap, Building2, Users,
  Scissors, Wrench, IndianRupee, Calendar, Filter, ArrowDownRight, Tag
} from 'lucide-react';
import {
  useOrderStore,
  FactoryExpense,
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_COLORS,
  fmt
} from '../../hooks/useOrderStore';

interface Props {
  store: ReturnType<typeof useOrderStore>;
  onNewExpense: () => void;
  onEditExpense: (expense: FactoryExpense) => void;
}

export default function ExpensesView({ store, onNewExpense, onEditExpense }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const expenses = store.state.factoryExpenses || [];

  // Available months from recorded expenses
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => {
      if (e.date && e.date.length >= 7) {
        set.add(e.date.slice(0, 7));
      }
    });
    // Add current month if not present
    set.add(new Date().toISOString().slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // Current month key
  const thisMonthKey = new Date().toISOString().slice(0, 7);

  // Financial calculations
  const totalAllTime = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalThisMonth = useMemo(
    () => expenses.filter(e => (e.date || '').startsWith(thisMonthKey)).reduce((s, e) => s + e.amount, 0),
    [expenses, thisMonthKey]
  );

  // Category breakdown for stats
  const topCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    return {
      category: sorted[0][0] as ExpenseCategory,
      amount: sorted[0][1],
      pct: totalAllTime > 0 ? Math.round((sorted[0][1] / totalAllTime) * 100) : 0,
    };
  }, [expenses, totalAllTime]);

  // Filtered expenses
  const filtered = useMemo(() => {
    return expenses.filter(e => {
      // Month filter
      if (selectedMonth !== 'all' && !(e.date || '').startsWith(selectedMonth)) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && e.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = (e.title || '').toLowerCase().includes(q);
        const matchPaidTo = (e.paidTo || '').toLowerCase().includes(q);
        const matchRef = (e.referenceNumber || '').toLowerCase().includes(q);
        const matchNotes = (e.notes || '').toLowerCase().includes(q);
        const matchNum = (e.expenseNumber || '').toLowerCase().includes(q);
        if (!matchTitle && !matchPaidTo && !matchRef && !matchNotes && !matchNum) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedMonth, selectedCategory, search]);

  const filteredTotal = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  const handleExportCSV = () => {
    const rows = [
      ['Expense #', 'Date', 'Title', 'Category', 'Paid To / Vendor', 'Payment Mode', 'Reference / UTR', 'Notes', 'Amount (INR)'],
      ...filtered.map(e => [
        e.expenseNumber,
        e.date,
        e.title,
        e.category === 'other' ? (e.customCategory || 'Custom') : EXPENSE_CATEGORY_LABELS[e.category],
        e.paidTo || '',
        (e.paymentMode || '').toUpperCase(),
        e.referenceNumber || '',
        e.notes || '',
        e.amount.toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factory-expenses-${selectedMonth === 'all' ? 'all-time' : selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete expense "${title}"?`)) {
      store.dispatch({ type: 'DELETE_EXPENSE', payload: id });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: This Month Expenses */}
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">This Month</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Zap size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-[#171717]">{fmt(totalThisMonth)}</p>
          <p className="text-[11px] text-[#71717A] mt-1">Total Factory Overheads</p>
        </div>

        {/* Card 2: All Time Expenses */}
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">All Time Total</span>
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <ArrowDownRight size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600">{fmt(totalAllTime)}</p>
          <p className="text-[11px] text-[#71717A] mt-1">{expenses.length} Total Recorded Entries</p>
        </div>

        {/* Card 3: Top Category */}
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#71717A]">Top Expense</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Building2 size={16} />
            </span>
          </div>
          <p className="text-lg font-black text-[#171717] truncate">
            {topCategory ? EXPENSE_CATEGORY_LABELS[topCategory.category]?.replace(/^[^\w\s]+/, '').trim() : '—'}
          </p>
          <p className="text-[11px] text-[#71717A] mt-1">
            {topCategory ? `${fmt(topCategory.amount)} (${topCategory.pct}% of total)` : 'No expenses recorded'}
          </p>
        </div>

        {/* Card 4: Filtered Subtotal */}
        <div className="bg-gradient-to-br from-amber-500 to-[#E4572E] text-white rounded-2xl p-5 shadow-md shadow-amber-500/20">
          <div className="flex items-center justify-between mb-2 text-white/80">
            <span className="text-xs font-bold uppercase tracking-wider">Filtered View</span>
            <Tag size={16} />
          </div>
          <p className="text-2xl font-black">{fmt(filteredTotal)}</p>
          <p className="text-[11px] text-white/90 mt-1">{filtered.length} entries in current filter</p>
        </div>
      </div>

      {/* ── Filters & Action Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E4DE] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              placeholder="Search expenses, vendors, notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Month Dropdown */}
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

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl text-xs font-bold text-[#171717] focus:outline-none"
          >
            <option value="all">🏷️ All Categories</option>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {filtered.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E4DE] bg-white text-xs font-bold text-[#52525B] hover:bg-[#FAF8F5] transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={onNewExpense}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#E4572E] text-white text-xs sm:text-sm font-black shadow-md shadow-amber-500/25 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>+ Add Factory Expense</span>
          </button>
        </div>
      </div>

      {/* ── Expenses Table ── */}
      <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E4DE] bg-[#FAF8F5] text-[11px] font-black uppercase tracking-wider text-[#71717A]">
                <th className="px-5 py-3.5">Expense # / Date</th>
                <th className="px-5 py-3.5">Expense Title & Category</th>
                <th className="px-5 py-3.5">Paid To / Vendor</th>
                <th className="px-5 py-3.5">Mode / Ref</th>
                <th className="px-5 py-3.5 text-right">Amount (₹)</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F3EF]">
              {filtered.map(exp => {
                const catLabel = exp.category === 'other'
                  ? (exp.customCategory || 'Custom Expense')
                  : EXPENSE_CATEGORY_LABELS[exp.category];
                const catClass = EXPENSE_CATEGORY_COLORS[exp.category] || 'bg-zinc-100 text-zinc-700 border-zinc-200';

                return (
                  <tr key={exp.id} className="hover:bg-[#FAF8F5] transition-colors group">
                    {/* Expense Number & Date */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-black text-amber-700 block">
                        {exp.expenseNumber}
                      </span>
                      <span className="text-[11px] text-[#71717A]">
                        {exp.date ? new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>

                    {/* Title & Category */}
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-sm text-[#171717]">{exp.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${catClass}`}>
                          {catLabel}
                        </span>
                        {exp.notes && (
                          <span className="text-[11px] text-[#71717A] truncate max-w-xs" title={exp.notes}>
                            {exp.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Paid To */}
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-semibold text-[#171717]">
                        {exp.paidTo || <span className="text-[#A1A1AA] italic">Not specified</span>}
                      </p>
                    </td>

                    {/* Payment Mode & Reference */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF8F5] border border-[#E8E4DE] text-[#52525B]">
                        {(exp.paymentMode || 'cash').toUpperCase()}
                      </span>
                      {exp.referenceNumber && (
                        <p className="text-[10px] font-mono text-[#71717A] mt-0.5 truncate max-w-[120px]" title={exp.referenceNumber}>
                          {exp.referenceNumber}
                        </p>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-black text-sm text-red-600 block">
                        - {fmt(exp.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditExpense(exp)}
                          title="Edit Expense"
                          className="w-7 h-7 rounded-lg bg-zinc-50 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id, exp.title)}
                          title="Delete Expense"
                          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="max-w-sm mx-auto text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                        <Zap size={24} />
                      </div>
                      <h4 className="font-bold text-sm text-[#171717]">No Factory Expenses Found</h4>
                      <p className="text-xs text-[#71717A]">
                        {search || selectedCategory !== 'all' || selectedMonth !== 'all'
                          ? 'No expenses match the current filter criteria.'
                          : 'Record electricity/light bills, factory rent, worker wages, and raw materials to track factory profit & overheads.'}
                      </p>
                      <button
                        onClick={onNewExpense}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#E4572E] text-white text-xs font-bold shadow-sm hover:scale-[1.02] cursor-pointer"
                      >
                        <Plus size={14} /> Add First Factory Expense
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
