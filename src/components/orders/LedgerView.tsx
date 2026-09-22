import React, { useState } from 'react';
import { Search, BookOpen, Download, Printer } from 'lucide-react';
import {
  useOrderStore, BusinessType, getCustomerLedger, fmt, STATUS_COLORS, STATUS_LABELS
} from '../../hooks/useOrderStore';

const cn = (...c: (string|undefined|boolean)[]) => c.filter(Boolean).join(' ');

interface Props {
  store: ReturnType<typeof useOrderStore>;
  customerId?: string;
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
  manufacturer: 'Manufacturer', designer: 'Designer', printing: 'Printing',
  payment: 'Payment', opening: 'Opening', adjustment: 'Adjustment',
};

export default function LedgerView({ store, customerId: propCustomerId }: Props) {
  const [customerId, setCustomerId] = useState(propCustomerId || '');
  const [custSearch, setCustSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const selectedCustomer = store.state.customers.find(c => c.id === customerId);
  const filteredCustomers = store.state.customers.filter(c =>
    !custSearch || c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.businessName.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch)
  );

  const ledger = customerId ? getCustomerLedger(store.state, customerId) : [];

  const filtered = ledger.filter(e => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (fromDate && e.date < fromDate) return false;
    if (toDate && e.date > toDate) return false;
    return true;
  });

  const totalDebits = filtered.filter(e => e.transactionType === 'debit').reduce((s, e) => s + e.amount, 0);
  const totalCredits = filtered.filter(e => e.transactionType === 'credit').reduce((s, e) => s + e.amount, 0);
  const closingBalance = filtered.length > 0 ? filtered[filtered.length - 1].balance : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ['Date','Description','Category','Reference','Debit','Credit','Balance'],
      ...filtered.map(e => [
        e.date, e.description, CATEGORY_LABELS[e.category] || e.category, e.referenceNumber,
        e.transactionType === 'debit' ? e.amount.toFixed(2) : '',
        e.transactionType === 'credit' ? e.amount.toFixed(2) : '',
        e.balance.toFixed(2),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ledger-${selectedCustomer?.businessName || 'all'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleWhatsApp = () => {
    if (!selectedCustomer) return;
    const msg = `Dear ${selectedCustomer.name},\n\nHere is your account statement with FiveNest:\n\nTotal Billed: ₹${totalDebits.toLocaleString('en-IN')}\nTotal Paid: ₹${totalCredits.toLocaleString('en-IN')}\nBalance Due: ₹${Math.max(0, closingBalance).toLocaleString('en-IN')}\n\nPlease contact us for any queries.\n— FiveNest`;
    window.open(`https://wa.me/91${selectedCustomer.whatsapp || selectedCustomer.phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Customer selector (if no prop) */}
      {!propCustomerId && (
        <div className="flex gap-3 items-start">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]"/>
            <input value={selectedCustomer ? selectedCustomer.businessName : custSearch}
              onChange={e => { setCustSearch(e.target.value); setCustomerId(''); }}
              placeholder="Search and select a customer..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E] bg-white"
            />
            {!customerId && custSearch && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E8E4DE] rounded-xl shadow-xl z-20 max-h-44 overflow-y-auto">
                {filteredCustomers.map(c => (
                  <button key={c.id} onClick={() => { setCustomerId(c.id); setCustSearch(''); }}
                    className="flex w-full px-4 py-3 hover:bg-[#FAF8F5] text-left border-b border-[#F0EDE8] last:border-0">
                    <div><p className="text-sm font-semibold">{c.businessName}</p><p className="text-xs text-[#71717A]">{c.name}</p></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer header */}
      {selectedCustomer && (
        <div className="flex items-start justify-between bg-[#FAF8F5] border border-[#E8E4DE] rounded-2xl p-5">
          <div>
            <h2 className="text-xl font-black text-[#171717]">{selectedCustomer.businessName}</h2>
            <p className="text-sm text-[#52525B]">{selectedCustomer.name} · {selectedCustomer.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-[#71717A] font-semibold">Balance Due</p>
            <p className={`text-2xl font-black ${closingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {fmt(Math.abs(closingBalance))}
            </p>
            <p className="text-xs text-[#71717A]">{closingBalance > 0 ? 'they owe you' : closingBalance < 0 ? 'you owe them' : 'settled'}</p>
          </div>
        </div>
      )}

      {/* Filters + actions */}
      {customerId && (
        <div className="flex flex-wrap items-center gap-3">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]">
            <option value="all">All Categories</option>
            {['manufacturer','designer','printing','payment','opening'].map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
            <span className="text-[#71717A] text-sm">to</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100">
              📱 WhatsApp
            </button>
            <button onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E4DE] text-xs font-bold hover:bg-[#FAF8F5]">
              <Download size={13}/> CSV
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E4DE] text-xs font-bold hover:bg-[#FAF8F5]">
              <Printer size={13}/> Print
            </button>
          </div>
        </div>
      )}

      {/* Ledger table */}
      {customerId && (
        filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#E8E4DE] rounded-2xl">
            <BookOpen size={40} className="mx-auto text-[#D8D5CF] mb-3"/>
            <p className="font-semibold text-[#52525B]">No Ledger Entries</p>
            <p className="text-sm text-[#71717A] mt-1">Transactions will appear here as orders and payments are recorded.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden">
            <div className="printable">
              {selectedCustomer && (
                <div className="px-6 py-3 bg-[#FAF8F5] border-b border-[#E8E4DE] print:block hidden">
                  <p className="font-black text-[#171717]">{selectedCustomer.businessName} — Account Statement</p>
                  <p className="text-xs text-[#71717A]">FiveNest · Date: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              )}
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E8E4DE]">
                    {['Date','Description','Category','Reference #','Debit','Credit','Balance'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[#71717A]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} className={cn('border-t border-[#E8E4DE] transition-colors', e.transactionType === 'credit' ? 'hover:bg-emerald-50/30' : 'hover:bg-amber-50/30')}>
                      <td className="px-4 py-3 text-xs text-[#71717A] whitespace-nowrap">
                        {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#171717] max-w-[200px] truncate" title={e.description}>{e.description}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border', CATEGORY_COLORS[e.category])}>
                          {CATEGORY_LABELS[e.category] || e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#71717A] font-mono">{e.referenceNumber || '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-amber-700">
                        {e.transactionType === 'debit' ? fmt(e.amount) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                        {e.transactionType === 'credit' ? fmt(e.amount) : '—'}
                      </td>
                      <td className={cn('px-4 py-3 text-sm font-black', e.balance > 0 ? 'text-red-600' : e.balance < 0 ? 'text-emerald-600' : 'text-[#71717A]')}>
                        {fmt(Math.abs(e.balance))}{e.balance !== 0 && <span className="text-[10px] font-normal ml-0.5">{e.balance > 0 ? 'Dr' : 'Cr'}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#E4572E]/20 bg-[#FAF8F5]">
                    <td colSpan={4} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#71717A]">Totals</td>
                    <td className="px-4 py-3 text-sm font-black text-amber-700">{fmt(totalDebits)}</td>
                    <td className="px-4 py-3 text-sm font-black text-emerald-600">{fmt(totalCredits)}</td>
                    <td className={cn('px-4 py-3 text-sm font-black', closingBalance > 0 ? 'text-red-600' : 'text-emerald-600')}>
                      {fmt(Math.abs(closingBalance))} {closingBalance > 0 ? 'Dr' : 'Cr'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      )}

      {!customerId && (
        <div className="text-center py-20 border border-dashed border-[#E8E4DE] rounded-2xl">
          <BookOpen size={42} className="mx-auto text-[#D8D5CF] mb-3"/>
          <p className="text-[#52525B] font-semibold">Select a Customer</p>
          <p className="text-sm text-[#71717A] mt-1">Search and select a customer to view their ledger.</p>
        </div>
      )}
    </div>
  );
}
