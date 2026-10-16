import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, IndianRupee, ArrowDownLeft, ArrowUpRight,
  Zap, Building2, Users, Scissors, Wrench, BarChart2, Calendar,
  ChevronRight, Plus, Sparkles, PieChart, Layers
} from 'lucide-react';
import {
  useOrderStore,
  fmt,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_COLORS
} from '../../hooks/useOrderStore';

interface Props {
  store: ReturnType<typeof useOrderStore>;
  onOpenLedger: () => void;
  onNewExpense: () => void;
  onReceivePayment: () => void;
}

export default function AnimatedFinancialDashboard({
  store,
  onOpenLedger,
  onNewExpense,
  onReceivePayment,
}: Props) {
  const [activeMetric, setActiveMetric] = useState<'both' | 'income' | 'expense' | 'profit'>('both');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Get monthly summary
  const summary = useMemo(() => {
    return store.getMonthlyFinancialSummary();
  }, [store.state]);

  const maxBarValue = useMemo(() => {
    let max = 1000;
    summary.monthlyHistory.forEach(m => {
      if (m.income > max) max = m.income;
      if (m.expenses > max) max = m.expenses;
    });
    return max;
  }, [summary.monthlyHistory]);

  const totalOutstanding = useMemo(() => {
    const mfg = store.state.manufacturerOrders.reduce((s, o) => s + (o.balanceAmount !== undefined ? o.balanceAmount : o.outstanding), 0);
    const dsg = store.state.designerBills.reduce((s, b) => s + b.outstanding, 0);
    const prt = store.state.printingOrders.reduce((s, o) => s + o.outstanding, 0);
    return mfg + dsg + prt;
  }, [store.state]);

  return (
    <div className="space-y-6">
      {/* ── 4 Interactive Animated Metric Buttons ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Inflow (Income) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveMetric(activeMetric === 'income' ? 'both' : 'income')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            activeMetric === 'income'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400'
              : 'bg-white text-[#171717] border-[#E8E4DE] hover:border-emerald-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              activeMetric === 'income' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <ArrowDownLeft size={20} />
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              activeMetric === 'income' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Collected
            </span>
          </div>
          <p className={`text-xs font-bold uppercase tracking-wider ${activeMetric === 'income' ? 'text-white/80' : 'text-[#71717A]'}`}>
            Monthly Inflow (Income)
          </p>
          <p className={`text-2xl font-black mt-1 ${activeMetric === 'income' ? 'text-white' : 'text-emerald-600'}`}>
            + {fmt(summary.totalIncome)}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 text-[11px]">
            <span className={activeMetric === 'income' ? 'text-white/80' : 'text-[#71717A]'}>From Orders & Bills</span>
            <span className={`font-bold ${activeMetric === 'income' ? 'text-white' : 'text-emerald-700'}`}>
              Click to Filter
            </span>
          </div>
        </motion.button>

        {/* Metric 2: Factory Expenses */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveMetric(activeMetric === 'expense' ? 'both' : 'expense')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            activeMetric === 'expense'
              ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/25 ring-2 ring-rose-400'
              : 'bg-white text-[#171717] border-[#E8E4DE] hover:border-rose-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              activeMetric === 'expense' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
            }`}>
              <Zap size={20} />
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              activeMetric === 'expense' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
            }`}>
              Overheads
            </span>
          </div>
          <p className={`text-xs font-bold uppercase tracking-wider ${activeMetric === 'expense' ? 'text-white/80' : 'text-[#71717A]'}`}>
            Factory Expenses
          </p>
          <p className={`text-2xl font-black mt-1 ${activeMetric === 'expense' ? 'text-white' : 'text-rose-600'}`}>
            - {fmt(summary.totalExpenses)}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 text-[11px]">
            <span className={activeMetric === 'expense' ? 'text-white/80' : 'text-[#71717A]'}>Light, Rent & Wages</span>
            <span className={`font-bold ${activeMetric === 'expense' ? 'text-white' : 'text-rose-700'}`}>
              Click to Filter
            </span>
          </div>
        </motion.button>

        {/* Metric 3: Net Profit / Cash Flow */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveMetric(activeMetric === 'profit' ? 'both' : 'profit')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            activeMetric === 'profit'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400'
              : 'bg-white text-[#171717] border-[#E8E4DE] hover:border-indigo-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              activeMetric === 'profit' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <TrendingUp size={20} />
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              activeMetric === 'profit' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}>
              Margin: {summary.profitMargin}%
            </span>
          </div>
          <p className={`text-xs font-bold uppercase tracking-wider ${activeMetric === 'profit' ? 'text-white/80' : 'text-[#71717A]'}`}>
            Net Cash Flow (Profit)
          </p>
          <p className={`text-2xl font-black mt-1 ${
            activeMetric === 'profit' ? 'text-white' : (summary.netProfit >= 0 ? 'text-indigo-600' : 'text-red-600')
          }`}>
            {summary.netProfit >= 0 ? '+ ' : ''}{fmt(summary.netProfit)}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 text-[11px]">
            <span className={activeMetric === 'profit' ? 'text-white/80' : 'text-[#71717A]'}>Income minus Expenses</span>
            <span className={`font-bold ${activeMetric === 'profit' ? 'text-white' : 'text-indigo-700'}`}>
              Click to Filter
            </span>
          </div>
        </motion.button>

        {/* Metric 4: Outstanding Receivables */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="p-5 rounded-2xl bg-white border border-[#E8E4DE] hover:border-amber-300 text-left transition-all hover:shadow-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-xl bg-orange-50 text-[#E4572E] flex items-center justify-center font-bold">
              <IndianRupee size={20} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-[#E4572E]">
              Receivables
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
            Balance Due (To Collect)
          </p>
          <p className="text-2xl font-black mt-1 text-red-600">
            {fmt(totalOutstanding)}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E8E4DE] text-[11px]">
            <span className="text-[#71717A]">Pending party dues</span>
            <button
              onClick={onReceivePayment}
              className="font-bold text-[#E4572E] hover:underline"
            >
              + Collect Payment
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Animated Monthly Bar Chart & Category Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Animated Monthly Income vs Expenses Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E8E4DE] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart2 size={18} className="text-[#E4572E]" />
                  <h3 className="font-black text-base text-[#171717]">
                    Monthly Income vs. Factory Expenses
                  </h3>
                </div>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Last 6 months comparison of revenue inflow vs operating expenses
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-3 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[#52525B]">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-[#52525B]">Expenses</span>
                </div>
              </div>
            </div>

            {/* Bars Canvas */}
            <div className="h-64 flex items-end gap-3 sm:gap-6 pt-8 pb-2 border-b border-[#E8E4DE] relative">
              {summary.monthlyHistory.map(m => {
                const incomeHeightPct = maxBarValue > 0 ? (m.income / maxBarValue) * 100 : 0;
                const expenseHeightPct = maxBarValue > 0 ? (m.expenses / maxBarValue) * 100 : 0;
                const isHovered = hoveredMonth === m.monthKey;

                return (
                  <div
                    key={m.monthKey}
                    onMouseEnter={() => setHoveredMonth(m.monthKey)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                  >
                    {/* Floating Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.9 }}
                          className="absolute bottom-full mb-2 z-20 bg-[#18181B] text-white p-2.5 rounded-xl shadow-xl text-center text-xs whitespace-nowrap min-w-[130px] pointer-events-none"
                        >
                          <p className="font-black border-b border-white/20 pb-1 mb-1">{m.monthLabel}</p>
                          <p className="text-emerald-400 font-bold">In: +{fmt(m.income)}</p>
                          <p className="text-rose-400 font-bold">Ex: -{fmt(m.expenses)}</p>
                          <p className={`font-black mt-1 pt-1 border-t border-white/10 ${m.profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                            Net: {fmt(m.profit)}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bars Pair Container */}
                    <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2 h-full">
                      {/* Income Bar (Emerald) */}
                      {(activeMetric === 'both' || activeMetric === 'income' || activeMetric === 'profit') && (
                        <div className="w-1/2 max-w-[28px] flex flex-col items-center justify-end h-full">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(incomeHeightPct, 2)}%` }}
                            transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
                            className={`w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm transition-all ${
                              isHovered ? 'ring-2 ring-emerald-300 scale-y-105' : ''
                            }`}
                          />
                        </div>
                      )}

                      {/* Expense Bar (Rose) */}
                      {(activeMetric === 'both' || activeMetric === 'expense' || activeMetric === 'profit') && (
                        <div className="w-1/2 max-w-[28px] flex flex-col items-center justify-end h-full">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(expenseHeightPct, 2)}%` }}
                            transition={{ duration: 0.8, delay: 0.1, type: 'spring', bounce: 0.2 }}
                            className={`w-full rounded-t-lg bg-gradient-to-t from-rose-600 to-rose-400 shadow-sm transition-all ${
                              isHovered ? 'ring-2 ring-rose-300 scale-y-105' : ''
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Month Label */}
                    <span className={`text-[11px] font-bold mt-2 transition-colors ${
                      isHovered ? 'text-[#E4572E] font-black' : 'text-[#71717A]'
                    }`}>
                      {m.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#E8E4DE]">
            <div className="text-xs text-[#71717A]">
              <span>Current Month Cash Flow: </span>
              <strong className={summary.netProfit >= 0 ? 'text-emerald-700 font-black' : 'text-red-600 font-black'}>
                {summary.netProfit >= 0 ? '+' : ''}{fmt(summary.netProfit)}
              </strong>
            </div>
            <button
              onClick={onOpenLedger}
              className="flex items-center gap-1.5 text-xs font-black text-[#E4572E] hover:text-[#D4431B] hover:underline"
            >
              <span>View Consolidated Monthly Ledger</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Col: Expense Breakdown by Category */}
        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart size={18} className="text-amber-500" />
                <h3 className="font-black text-sm text-[#171717]">
                  Expense Breakdown
                </h3>
              </div>
              <button
                onClick={onNewExpense}
                className="flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer"
              >
                <Plus size={12} />
                <span>+ Add</span>
              </button>
            </div>

            {summary.expensesByCategory.length > 0 ? (
              <div className="space-y-3.5 my-2">
                {summary.expensesByCategory.map(cat => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#171717] flex items-center gap-1.5">
                        {cat.label}
                      </span>
                      <span className="font-black text-[#171717]">{fmt(cat.amount)}</span>
                    </div>
                    {/* Animated Progress Bar */}
                    <div className="h-2 w-full bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E8E4DE]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          cat.category === 'electricity' ? 'bg-amber-500' :
                          cat.category === 'rent' ? 'bg-indigo-500' :
                          cat.category === 'salary' ? 'bg-emerald-500' :
                          cat.category === 'raw_material' ? 'bg-orange-500' :
                          cat.category === 'maintenance' ? 'bg-rose-500' :
                          'bg-zinc-600'
                        }`}
                      />
                    </div>
                    <div className="flex justify-end text-[10px] text-[#71717A] font-semibold">
                      {cat.percentage}% of factory expenses
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Zap size={24} />
                </div>
                <p className="text-xs font-bold text-[#171717]">No expenses recorded this month</p>
                <p className="text-[11px] text-[#71717A]">
                  Add light bills, rent, worker wages, and raw materials to see the breakdown.
                </p>
                <button
                  onClick={onNewExpense}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#E4572E] text-white text-xs font-bold shadow-xs hover:scale-[1.02]"
                >
                  + Add Light Bill / Rent
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E8E4DE] flex items-center justify-between text-xs">
            <span className="text-[#71717A]">Total Recorded:</span>
            <span className="font-black text-rose-600 text-sm">{fmt(summary.totalExpenses)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
