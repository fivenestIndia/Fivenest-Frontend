import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, Plus, Search, Calendar, Tag, Trash2, Edit3, CheckCircle, 
  Clock, TrendingDown, TrendingUp, Building2, Printer, Palette, FileText, 
  X, Save, CreditCard, Zap, UserCheck, ShieldAlert, FolderOpen, ArrowUpRight, ArrowDownRight, PieChart
} from 'lucide-react';

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: 'Rent' | 'Salaries & Wages' | 'Electricity & Power' | 'Raw Materials' | 'Machine Maintenance' | 'Software & Tools' | 'Tea & Misc';
  date: string;
  rolePanel: 'printing' | 'factory' | 'designer';
  payeeName?: string;
  paymentMethod: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';
  status: 'Paid' | 'Pending';
  notes?: string;
}

interface FactoryExpensesProps {
  currentUserEmail?: string;
  totalRevenue?: number;
}

export function FactoryExpenses({ currentUserEmail, totalRevenue = 0 }: FactoryExpensesProps) {
  // Active Panel Role Selection (Printing Owner | Factory Owner | Designer)
  const [activeRolePanel, setActiveRolePanel] = useState<'printing' | 'factory' | 'designer'>('factory');

  const storageKey = currentUserEmail 
    ? `fivenest_factory_expenses_${currentUserEmail.toLowerCase().trim()}` 
    : 'fivenest_factory_expenses_default';

  const [expensesList, setExpensesList] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Pre-populated default factory expenses
    return [
      { id: 'exp-1', title: 'Factory Premises Monthly Rent', amount: 25000, category: 'Rent', date: '01-08-2026', rolePanel: 'factory', payeeName: 'Ludhiana Industrial Estate', paymentMethod: 'Bank Transfer', status: 'Paid' },
      { id: 'exp-2', title: 'Cutting & Stitching Tailor Salaries', amount: 48000, category: 'Salaries & Wages', date: '05-08-2026', rolePanel: 'factory', payeeName: 'Workshop Staff (6 Tailors)', paymentMethod: 'UPI', status: 'Paid' },
      { id: 'exp-3', title: '3-Phase Heavy Electricity Power Bill', amount: 14200, category: 'Electricity & Power', date: '07-08-2026', rolePanel: 'factory', payeeName: 'Punjab State Power Corp', paymentMethod: 'UPI', status: 'Pending' },
      { id: 'exp-4', title: 'Sublimation Ink Supplies (4 Colors)', amount: 12500, category: 'Raw Materials', date: '04-08-2026', rolePanel: 'printing', payeeName: 'J-Teck Ink Importers', paymentMethod: 'UPI', status: 'Paid' },
      { id: 'exp-5', title: 'Sublimation Paper Rolls (100 GSM, 64")', amount: 18000, category: 'Raw Materials', date: '03-08-2026', rolePanel: 'printing', payeeName: 'Hansol Paper Corp', paymentMethod: 'Bank Transfer', status: 'Paid' },
      { id: 'exp-6', title: 'Ergosoft RIP Software License', amount: 4500, category: 'Software & Tools', date: '01-08-2026', rolePanel: 'printing', payeeName: 'Ergosoft AG', paymentMethod: 'CreditCard' as any, status: 'Paid' },
      { id: 'exp-7', title: 'Senior 3D Jersey Artist Salary', amount: 35000, category: 'Salaries & Wages', date: '05-08-2026', rolePanel: 'designer', payeeName: 'Lead Designer', paymentMethod: 'Bank Transfer', status: 'Paid' },
      { id: 'exp-8', title: 'Freepik & Shutterstock Graphic Subscriptions', amount: 3200, category: 'Software & Tools', date: '02-08-2026', rolePanel: 'designer', payeeName: 'Freepik Company', paymentMethod: 'UPI', status: 'Paid' }
    ];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(expensesList));
  }, [expensesList, storageKey]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ExpenseRecord>>({});

  // Filtered Expenses
  const filteredExpenses = expensesList.filter((exp) => {
    const matchesRole = !exp.rolePanel || exp.rolePanel === activeRolePanel;
    const matchesSearch = 
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.payeeName && exp.payeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || exp.status === statusFilter;
    return matchesRole && matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate Metrics
  const totalPaidExpenses = filteredExpenses
    .filter(e => e.status === 'Paid')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPendingExpenses = filteredExpenses
    .filter(e => e.status === 'Pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalGrandExpenses = totalPaidExpenses + totalPendingExpenses;
  const netProfit = totalRevenue - totalGrandExpenses;

  const handleOpenAddModal = (existing?: ExpenseRecord) => {
    if (existing) {
      setFormData({ ...existing });
    } else {
      setFormData({
        id: `exp-${Date.now()}`,
        title: '',
        amount: 5000,
        category: activeRolePanel === 'printing' ? 'Raw Materials' : activeRolePanel === 'factory' ? 'Rent' : 'Salaries & Wages',
        date: new Date().toLocaleDateString('en-IN'),
        rolePanel: activeRolePanel,
        payeeName: '',
        paymentMethod: 'UPI',
        status: 'Paid',
        notes: ''
      });
    }
    setModalOpen(true);
  };

  const handleSaveExpense = () => {
    if (!formData.title?.trim() || !formData.amount) {
      alert('Please enter an expense title and valid amount.');
      return;
    }

    const finalRecord: ExpenseRecord = {
      id: formData.id || `exp-${Date.now()}`,
      title: formData.title || 'Factory Expense',
      amount: Number(formData.amount || 0),
      category: formData.category || 'Tea & Misc',
      date: formData.date || new Date().toLocaleDateString('en-IN'),
      rolePanel: formData.rolePanel || activeRolePanel,
      payeeName: formData.payeeName || '',
      paymentMethod: formData.paymentMethod || 'UPI',
      status: formData.status || 'Paid',
      notes: formData.notes || ''
    };

    const idx = expensesList.findIndex(e => e.id === finalRecord.id);
    let updated: ExpenseRecord[];
    if (idx >= 0) {
      updated = [...expensesList];
      updated[idx] = finalRecord;
    } else {
      updated = [finalRecord, ...expensesList];
    }

    setExpensesList(updated);
    setModalOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Delete this expense entry?')) {
      setExpensesList(expensesList.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6 font-sans p-2 md:p-4 text-left">
      
      {/* 🏆 PANEL ROLE SWITCHER HEADER */}
      <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              📊 Factory Expenses & P&L Manager
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Expense Tracker & Cost Management</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Manage factory rents, tailor salaries, electricity/light bills, raw materials & software subscriptions per panel.
          </p>
        </div>

        {/* 3 Panel Role Mode Selector */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-950 border border-slate-800 gap-1.5">
          <button
            onClick={() => setActiveRolePanel('printing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeRolePanel === 'printing'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Printer size={15} />
            <span>Printing Owner Expenses</span>
          </button>

          <button
            onClick={() => setActiveRolePanel('factory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeRolePanel === 'factory'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 size={15} />
            <span>Factory Owner Expenses</span>
          </button>

          <button
            onClick={() => setActiveRolePanel('designer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeRolePanel === 'designer'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette size={15} />
            <span>Designer Panel Expenses</span>
          </button>
        </div>
      </div>

      {/* Financial Analytics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-rose-500/30 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Total Paid Expenses</span>
            <TrendingDown size={20} className="text-rose-400" />
          </div>
          <div className="text-3xl font-black text-white">₹{totalPaidExpenses.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-400 mt-1">Paid in active panel</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-amber-500/30 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pending Bills / Due</span>
            <Clock size={20} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">₹{totalPendingExpenses.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-400 mt-1">Awaiting vendor payment</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Total Combined Costs</span>
            <DollarSign size={20} className="text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white">₹{totalGrandExpenses.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-400 mt-1">{filteredExpenses.length} expense records</p>
        </div>

        <div className={`p-6 rounded-3xl border backdrop-blur-xl ${netProfit >= 0 ? 'bg-slate-900/60 border-emerald-500/30' : 'bg-slate-900/60 border-rose-500/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Net Factory Profit</span>
            {netProfit >= 0 ? <ArrowUpRight size={20} className="text-emerald-400" /> : <ArrowDownRight size={20} className="text-rose-400" />}
          </div>
          <div className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₹{netProfit.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Revenue minus expenses</p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, payee, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs md:text-sm focus:outline-none focus:border-purple-400 transition-all"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-bold focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Rent">Rent</option>
            <option value="Salaries & Wages">Salaries & Wages</option>
            <option value="Electricity & Power">Electricity & Power</option>
            <option value="Raw Materials">Raw Materials</option>
            <option value="Machine Maintenance">Machine Maintenance</option>
            <option value="Software & Tools">Software & Tools</option>
            <option value="Tea & Misc">Tea & Misc</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-bold focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Add Expense Button */}
        <button
          onClick={() => handleOpenAddModal()}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>+ Add Factory Expense</span>
        </button>
      </div>

      {/* Main Expenses Table */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-extrabold uppercase tracking-wider">
                <th className="p-4">Expense Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Date</th>
                <th className="p-4">Payee / Vendor</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4 text-right">Amount (₹)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                    No expense records found matching current filter. Click "+ Add Factory Expense" to add a record.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      {exp.title}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 font-bold text-[10px] border border-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{exp.date}</td>
                    <td className="p-4 text-slate-300 font-medium">{exp.payeeName || 'N/A'}</td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">{exp.paymentMethod}</td>
                    <td className="p-4 text-right font-black text-rose-400 text-sm">₹{exp.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        exp.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenAddModal(exp)}
                          className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT EXPENSE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 text-left shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                  {activeRolePanel.toUpperCase()} PANEL EXPENSE
                </span>
                <h2 className="text-xl font-black text-white">Record Factory Expense Entry</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block text-slate-400 font-bold mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Workshop Monthly Rent, Sublimation Ink, Tailor Salary"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={formData.amount || 0}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-rose-400 font-black text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Category Select</label>
                <select
                  value={formData.category || 'Rent'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                >
                  <option value="Rent">Rent</option>
                  <option value="Salaries & Wages">Salaries & Wages</option>
                  <option value="Electricity & Power">Electricity & Power</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Machine Maintenance">Machine Maintenance</option>
                  <option value="Software & Tools">Software & Tools</option>
                  <option value="Tea & Misc">Tea & Misc</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payee / Vendor Name</label>
                <input
                  type="text"
                  value={formData.payeeName || ''}
                  onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                  placeholder="e.g. Ludhiana Electricity Board / Ramu Tailor"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Date</label>
                <input
                  type="text"
                  value={formData.date || new Date().toLocaleDateString('en-IN')}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod || 'UPI'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                >
                  <option value="UPI">UPI (GPay/PhonePe/Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Status</label>
                <select
                  value={formData.status || 'Paid'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending / Unpaid Bill</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 font-bold mb-1">Notes / Bill Reference</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Receipt bill no., invoice notes..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveExpense}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs flex items-center gap-2"
              >
                <Save size={16} />
                <span>Save Expense Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
