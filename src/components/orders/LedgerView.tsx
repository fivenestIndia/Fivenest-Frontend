import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, BookOpen, Download, Printer, CreditCard, MessageSquare,
  Users, Building2, Phone, Mail, MapPin, CheckCircle, ArrowDownLeft,
  ArrowUpRight, Filter, ChevronRight, FileSpreadsheet, Eye
} from 'lucide-react';
import {
  useOrderStore, BusinessType, getCustomerLedger, getCustomerSummary, fmt,
  STATUS_COLORS, STATUS_LABELS
} from '../../hooks/useOrderStore';

const cn = (...c: (string | undefined | boolean)[]) => c.filter(Boolean).join(' ');

interface Props {
  store: ReturnType<typeof useOrderStore>;
  customerId?: string;
  mode?: 'all' | BusinessType;
  onSelectCustomer?: (customerId: string) => void;
  onReceivePayment?: (customerId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  manufacturer: 'bg-orange-50 text-orange-700 border-orange-200',
  designer:     'bg-purple-50 text-purple-700 border-purple-200',
  printing:     'bg-blue-50 text-blue-700 border-blue-200',
  payment:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  opening:      'bg-zinc-100 text-zinc-600 border-zinc-200',
  adjustment:   'bg-zinc-100 text-zinc-600 border-zinc-200',
};

const CATEGORY_LABELS: Record<string, string> = {
  manufacturer: 'Manufacturer Order',
  designer:     'Designer Bill',
  printing:     'Printing Order',
  payment:      'Payment Received',
  opening:      'Opening Balance',
  adjustment:   'Balance Adjustment',
};

export default function LedgerView({
  store,
  customerId: propCustomerId,
  mode = 'all',
  onSelectCustomer,
  onReceivePayment,
}: Props) {
  // Party directory filter & selection
  const [selectedId, setSelectedId] = useState<string>(propCustomerId || '');
  const [custSearch, setCustSearch] = useState('');
  const [partyTab, setPartyTab] = useState<'all' | 'due' | BusinessType>(
    mode !== 'all' ? mode : 'all'
  );

  // Statement filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'this_month' | 'last_30'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Sync prop changes
  useEffect(() => {
    if (propCustomerId) {
      setSelectedId(propCustomerId);
    }
  }, [propCustomerId]);

  // When mode changes, optionally update partyTab
  useEffect(() => {
    if (mode !== 'all') {
      setPartyTab(mode);
    }
  }, [mode]);

  // Load Company Profile for printing & WhatsApp
  const companyProfile = useMemo(() => {
    try {
      const saved = localStorage.getItem('fn_company_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      companyName: 'FiveNest Apparels',
      tagline: 'Sportswear & Sublimation Printing Studio',
      address: 'Textile Industrial Hub',
      cityStatePin: 'Maharashtra, India',
      phone: '+91 96640 90039',
      email: 'orders@fivenest.in',
      gstin: '',
    };
  }, []);

  // Filter customers for directory
  const filteredCustomers = useMemo(() => {
    const q = custSearch.trim().toLowerCase();
    return store.state.customers.filter(c => {
      // Search match
      const matchSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.businessName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.gstin.toLowerCase().includes(q);

      if (!matchSearch) return false;

      const summary = getCustomerSummary(store.state, c.id);

      // Tab filter
      if (partyTab === 'due') return summary.outstanding > 0;
      if (partyTab === 'manufacturer') return summary.services.includes('manufacturer') || store.state.manufacturerOrders.some(o => o.customerId === c.id);
      if (partyTab === 'designer') return summary.services.includes('designer') || store.state.designerBills.some(b => b.customerId === c.id);
      if (partyTab === 'printing') return summary.services.includes('printing') || store.state.printingOrders.some(o => o.customerId === c.id);

      return true;
    });
  }, [store.state, custSearch, partyTab]);

  // Auto-select first customer if none is currently selected
  useEffect(() => {
    if (!selectedId && filteredCustomers.length > 0) {
      const first = filteredCustomers[0].id;
      setSelectedId(first);
      if (onSelectCustomer) onSelectCustomer(first);
    } else if (selectedId && !store.state.customers.some(c => c.id === selectedId) && filteredCustomers.length > 0) {
      const first = filteredCustomers[0].id;
      setSelectedId(first);
      if (onSelectCustomer) onSelectCustomer(first);
    }
  }, [selectedId, filteredCustomers, onSelectCustomer, store.state.customers]);

  const handleSelectParty = (id: string) => {
    setSelectedId(id);
    if (onSelectCustomer) onSelectCustomer(id);
  };

  const selectedCustomer = store.state.customers.find(c => c.id === selectedId);
  const selectedSummary = selectedCustomer ? getCustomerSummary(store.state, selectedCustomer.id) : null;

  // Retrieve raw ledger entries
  const rawLedger = useMemo(() => {
    return selectedId ? getCustomerLedger(store.state, selectedId) : [];
  }, [store.state, selectedId]);

  // Handle Date range preset clicks
  const applyDatePreset = (preset: 'all' | 'this_month' | 'last_30') => {
    setDateRangePreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      setFromDate(start);
      setToDate(end);
    } else if (preset === 'last_30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFromDate(d.toISOString().slice(0, 10));
      setToDate(now.toISOString().slice(0, 10));
    }
  };

  // Filter ledger entries by category and date
  const filteredLedger = useMemo(() => {
    return rawLedger.filter(e => {
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      if (fromDate && e.date < fromDate) return false;
      if (toDate && e.date > toDate) return false;
      return true;
    });
  }, [rawLedger, filterCategory, fromDate, toDate]);

  // Recalculate totals for visible items
  const totalDebits = filteredLedger.filter(e => e.transactionType === 'debit').reduce((s, e) => s + e.amount, 0);
  const totalCredits = filteredLedger.filter(e => e.transactionType === 'credit').reduce((s, e) => s + e.amount, 0);
  const closingBalance = filteredLedger.length > 0 ? filteredLedger[filteredLedger.length - 1].balance : (selectedSummary?.outstanding || 0);

  // Print Statement
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!selectedCustomer) return;
    const rows = [
      ['Date', 'Particulars / Description', 'Category', 'Voucher / Ref #', 'Debit (INR)', 'Credit (INR)', 'Balance (INR)'],
      ...filteredLedger.map(e => [
        e.date,
        e.description.replace(/"/g, '""'),
        CATEGORY_LABELS[e.category] || e.category,
        e.referenceNumber || '',
        e.transactionType === 'debit' ? e.amount.toFixed(2) : '',
        e.transactionType === 'credit' ? e.amount.toFixed(2) : '',
        e.balance.toFixed(2) + (e.balance > 0 ? ' Dr' : e.balance < 0 ? ' Cr' : ''),
      ]),
      ['', 'Totals', '', '', totalDebits.toFixed(2), totalCredits.toFixed(2), closingBalance.toFixed(2)],
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ledger-${selectedCustomer.businessName.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // WhatsApp Statement Summary
  const handleWhatsApp = () => {
    if (!selectedCustomer) return;
    const phone = selectedCustomer.whatsapp || selectedCustomer.phone;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const balanceText = closingBalance > 0
      ? `⚠️ *Balance Due: ${fmt(closingBalance)}* (Dr)`
      : closingBalance < 0
      ? `✅ *Advance Balance: ${fmt(Math.abs(closingBalance))}* (Cr)`
      : `✅ *Account Settled (₹0)*`;

    const recentLines = filteredLedger.slice(-5).map(e => {
      const typeLabel = e.transactionType === 'debit' ? `Billed ${fmt(e.amount)}` : `Paid ${fmt(e.amount)}`;
      return `• ${e.date}: ${e.description} (${typeLabel})`;
    }).join('\n');

    const msg = `*${companyProfile.companyName}*\n` +
      `📋 *ACCOUNT STATEMENT / LEDGER*\n` +
      `👤 Party: *${selectedCustomer.businessName}* (${selectedCustomer.name})\n` +
      `📅 As on: ${new Date().toLocaleDateString('en-IN')}\n\n` +
      `💰 *Total Billed:* ${fmt(totalDebits)}\n` +
      `💳 *Total Received:* ${fmt(totalCredits)}\n` +
      `${balanceText}\n\n` +
      `*Recent Transactions:*\n${recentLines || 'No recent entries'}\n\n` +
      `_For questions or invoice copies, please contact us at ${companyProfile.phone}._`;

    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* ── Master-Detail Layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left Column: Party / Customer Directory (4 cols) ──────────────── */}
        <div className="lg:col-span-4 bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden shadow-sm flex flex-col max-h-[820px] print:hidden">
          {/* Directory Header */}
          <div className="p-4 border-b border-[#E8E4DE] space-y-3 bg-[#FAF8F5]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#E4572E]" />
                <h3 className="font-bold text-sm text-[#171717]">Parties & Customers</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-[#E8E4DE] text-[#71717A]">
                {filteredCustomers.length}
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
              <input
                value={custSearch}
                onChange={e => setCustSearch(e.target.value)}
                placeholder="Search party, phone, GSTIN..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E] bg-white"
              />
            </div>

            {/* Business & Due Quick Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-semibold">
              {[
                { key: 'all', label: 'All' },
                { key: 'due', label: 'Pending Due' },
                { key: 'manufacturer', label: 'Mfg' },
                { key: 'designer', label: 'Designer' },
                { key: 'printing', label: 'Printing' },
              ].map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setPartyTab(t.key as typeof partyTab)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap',
                    partyTab === t.key
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-[#52525B] border-[#E8E4DE] hover:border-[#E4572E]/40'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Party List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F0EDE8]">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users size={32} className="mx-auto text-[#D8D5CF] mb-2" />
                <p className="font-semibold text-xs text-[#52525B]">No parties found</p>
                <p className="text-[11px] text-[#71717A] mt-1">Try another search term or filter.</p>
              </div>
            ) : (
              filteredCustomers.map(cust => {
                const isSelected = cust.id === selectedId;
                const summary = getCustomerSummary(store.state, cust.id);
                const hasDue = summary.outstanding > 0;
                const isAdvance = summary.outstanding < 0;

                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleSelectParty(cust.id)}
                    className={cn(
                      'w-full text-left p-3.5 transition-all flex items-start justify-between gap-3 group relative',
                      isSelected
                        ? 'bg-[#FDF2ED] border-l-4 border-l-[#E4572E]'
                        : 'hover:bg-[#FAF8F5]'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={cn('text-sm font-bold truncate', isSelected ? 'text-[#E4572E]' : 'text-[#171717]')}>
                          {cust.businessName}
                        </p>
                      </div>
                      <p className="text-xs text-[#71717A] truncate mt-0.5">
                        {cust.name} {cust.phone && `· ${cust.phone}`}
                      </p>

                      {/* Service tags */}
                      <div className="flex items-center gap-1 mt-1.5">
                        {summary.services.map(s => (
                          <span
                            key={s}
                            className={cn(
                              'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase',
                              s === 'manufacturer' && 'bg-orange-100 text-orange-800',
                              s === 'designer' && 'bg-purple-100 text-purple-800',
                              s === 'printing' && 'bg-blue-100 text-blue-800'
                            )}
                          >
                            {s === 'manufacturer' ? 'MFG' : s === 'designer' ? 'DSG' : 'PRT'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Balance pill */}
                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          'text-xs font-black',
                          hasDue ? 'text-red-600' : isAdvance ? 'text-emerald-600' : 'text-[#71717A]'
                        )}
                      >
                        {fmt(Math.abs(summary.outstanding))}
                        <span className="text-[10px] font-normal ml-0.5">
                          {hasDue ? 'Dr' : isAdvance ? 'Cr' : ''}
                        </span>
                      </p>
                      <span className="text-[10px] text-[#71717A] block">
                        {hasDue ? 'Due' : isAdvance ? 'Advance' : 'Settled'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Column: Party Statement / Ledger Card (8 cols) ─────────── */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCustomer ? (
            <>
              {/* Customer Profile & KPI Header Card */}
              <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-[#171717]">
                        {selectedCustomer.businessName}
                      </h2>
                      {selectedCustomer.customerType && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E4DE] text-[#71717A]">
                          {selectedCustomer.customerType}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#52525B] mt-1">
                      <span className="font-semibold text-[#171717]">{selectedCustomer.name}</span>
                      <span>📞 {selectedCustomer.phone}</span>
                      {selectedCustomer.email && <span>✉️ {selectedCustomer.email}</span>}
                      {selectedCustomer.gstin && <span className="font-mono">GSTIN: {selectedCustomer.gstin}</span>}
                    </div>
                    {selectedCustomer.billingAddress && (
                      <p className="text-xs text-[#71717A] mt-1 leading-snug">
                        📍 {selectedCustomer.billingAddress}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all shadow-sm"
                      title="Share Statement Summary on WhatsApp"
                    >
                      <MessageSquare size={14} /> WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E4DE] bg-white text-xs font-semibold text-[#171717] hover:bg-[#FAF8F5] transition-all shadow-sm"
                      title="Export Statement to CSV"
                    >
                      <Download size={14} /> CSV
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#171717] text-white text-xs font-bold hover:bg-black transition-all shadow-sm"
                      title="Print Account Statement"
                    >
                      <Printer size={14} /> Print
                    </button>

                    {onReceivePayment && (
                      <button
                        type="button"
                        onClick={() => onReceivePayment(selectedCustomer.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B] transition-all shadow-sm"
                      >
                        <CreditCard size={14} /> Receive Payment
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Summary Strip */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E8E4DE]">
                  <div className="bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
                      Total Billed
                    </span>
                    <p className="text-lg sm:text-xl font-black text-[#171717] mt-0.5">
                      {fmt(totalDebits)}
                    </p>
                    <span className="text-[10px] text-[#71717A]">All debits / invoices</span>
                  </div>

                  <div className="bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
                      Total Received
                    </span>
                    <p className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5">
                      {fmt(totalCredits)}
                    </p>
                    <span className="text-[10px] text-emerald-700">Payments & credits</span>
                  </div>

                  <div className="bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
                      Net Balance
                    </span>
                    <p
                      className={cn(
                        'text-lg sm:text-xl font-black mt-0.5',
                        closingBalance > 0 ? 'text-red-600' : closingBalance < 0 ? 'text-emerald-600' : 'text-[#71717A]'
                      )}
                    >
                      {fmt(Math.abs(closingBalance))}
                      <span className="text-xs font-normal ml-1">
                        {closingBalance > 0 ? 'Dr (Due)' : closingBalance < 0 ? 'Cr (Advance)' : 'Settled'}
                      </span>
                    </p>
                    <span className="text-[10px] text-[#71717A]">
                      {closingBalance > 0 ? 'they owe you' : closingBalance < 0 ? 'excess advance' : 'all settled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Filter */}
                  <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                    <Filter size={13} />
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#E8E4DE] text-xs font-semibold focus:outline-none focus:border-[#E4572E] bg-white text-[#171717]"
                    >
                      <option value="all">All Categories</option>
                      <option value="manufacturer">Manufacturing Orders</option>
                      <option value="designer">Designer Bills</option>
                      <option value="printing">Printing Orders</option>
                      <option value="payment">Payments</option>
                      <option value="opening">Opening Balance</option>
                    </select>
                  </div>

                  {/* Date presets */}
                  <div className="flex items-center gap-1 text-xs">
                    {(['all', 'this_month', 'last_30'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => applyDatePreset(p)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all',
                          dateRangePreset === p
                            ? 'bg-[#FAF8F5] text-[#E4572E] border-[#E4572E]'
                            : 'bg-white text-[#52525B] border-[#E8E4DE] hover:border-gray-300'
                        )}
                      >
                        {p === 'all' ? 'All Time' : p === 'this_month' ? 'This Month' : 'Last 30 Days'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Inputs */}
                <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => { setFromDate(e.target.value); setDateRangePreset('all'); }}
                    className="px-2 py-1 rounded-lg border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E] bg-white"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => { setToDate(e.target.value); setDateRangePreset('all'); }}
                    className="px-2 py-1 rounded-lg border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E] bg-white"
                  />
                </div>
              </div>

              {/* Statement Table Card */}
              <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden shadow-sm">
                <div id="printable-statement" className="p-0">
                  {/* Print-only Statement Header */}
                  <div className="hidden print:block p-6 border-b-2 border-black">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-2xl font-black uppercase text-black">{companyProfile.companyName}</h1>
                        <p className="text-xs text-gray-700">{companyProfile.address}, {companyProfile.cityStatePin}</p>
                        <p className="text-xs text-gray-700">Phone: {companyProfile.phone} | GSTIN: {companyProfile.gstin}</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-lg font-black text-black">PARTY ACCOUNT STATEMENT</h2>
                        <p className="text-xs text-gray-600">Generated: {new Date().toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-300 grid grid-cols-2 text-xs">
                      <div>
                        <strong className="text-sm block text-black">{selectedCustomer.businessName}</strong>
                        <p>Contact: {selectedCustomer.name} · {selectedCustomer.phone}</p>
                        <p>Address: {selectedCustomer.billingAddress || '—'}</p>
                        {selectedCustomer.gstin && <p>GSTIN: {selectedCustomer.gstin}</p>}
                      </div>
                      <div className="text-right">
                        <p>Total Debits: <strong>{fmt(totalDebits)}</strong></p>
                        <p>Total Credits: <strong>{fmt(totalCredits)}</strong></p>
                        <p className="text-sm font-black mt-1">
                          Closing Balance: {fmt(Math.abs(closingBalance))} {closingBalance > 0 ? 'Dr' : 'Cr'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {filteredLedger.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <BookOpen size={40} className="mx-auto text-[#D8D5CF] mb-3" />
                      <p className="font-semibold text-sm text-[#52525B]">No ledger entries match your filter</p>
                      <p className="text-xs text-[#71717A] mt-1">
                        Try resetting date filters or selecting "All Categories".
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[#FAF8F5] border-b border-[#E8E4DE]">
                            <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[#71717A]">Date</th>
                            <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[#71717A]">Type</th>
                            <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[#71717A]">Ref #</th>
                            <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[#71717A]">Particulars / Details</th>
                            <th className="text-right px-4 py-3 font-semibold uppercase tracking-wider text-amber-800">Debit (₹)</th>
                            <th className="text-right px-4 py-3 font-semibold uppercase tracking-wider text-emerald-800">Credit (₹)</th>
                            <th className="text-right px-4 py-3 font-semibold uppercase tracking-wider text-[#171717]">Running Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E4DE]">
                          {filteredLedger.map((e) => {
                            const isDebit = e.transactionType === 'debit';
                            return (
                              <tr
                                key={e.id}
                                className={cn(
                                  'hover:bg-[#FAF8F5] transition-colors',
                                  isDebit ? 'hover:bg-amber-50/20' : 'hover:bg-emerald-50/20'
                                )}
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-[#71717A] font-mono">
                                  {new Date(e.date).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span
                                    className={cn(
                                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                      CATEGORY_COLORS[e.category] || 'bg-gray-100 text-gray-700 border-gray-200'
                                    )}
                                  >
                                    {CATEGORY_LABELS[e.category] || e.category}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-[#52525B]">
                                  {e.referenceNumber || '—'}
                                </td>
                                <td className="px-4 py-3 max-w-[260px] truncate font-medium text-[#171717]" title={e.description}>
                                  {e.description}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-amber-800 whitespace-nowrap">
                                  {isDebit ? fmt(e.amount) : '—'}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                                  {!isDebit ? fmt(e.amount) : '—'}
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <span
                                    className={cn(
                                      'font-black',
                                      e.balance > 0 ? 'text-red-600' : e.balance < 0 ? 'text-emerald-600' : 'text-[#71717A]'
                                    )}
                                  >
                                    {fmt(Math.abs(e.balance))}
                                    <span className="text-[10px] font-normal ml-0.5">
                                      {e.balance > 0 ? 'Dr' : e.balance < 0 ? 'Cr' : ''}
                                    </span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#FAF8F5] border-t-2 border-[#E4572E]/30 font-black">
                            <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider text-xs text-[#71717A]">
                              Statement Totals:
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-amber-800">
                              {fmt(totalDebits)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-emerald-600">
                              {fmt(totalCredits)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              <span className={closingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                {fmt(Math.abs(closingBalance))} {closingBalance > 0 ? 'Dr' : closingBalance < 0 ? 'Cr' : ''}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-[#E8E4DE] rounded-2xl p-12 text-center shadow-sm">
              <Users size={48} className="mx-auto text-[#D8D5CF] mb-3" />
              <h3 className="font-black text-lg text-[#171717]">No Party Selected</h3>
              <p className="text-xs text-[#71717A] mt-1 max-w-sm mx-auto">
                Select a party from the left directory to view their complete statement, invoices, payments, and balance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Clean A4 Print Styles for Ledger */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-statement, #printable-statement * {
            visibility: visible !important;
          }
          #printable-statement {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  );
}
