import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, CreditCard, AlertCircle } from 'lucide-react';
import {
  useOrderStore, ManufacturerOrder, DesignerBill, PrintingOrder,
  PAYMENT_MODES, PAYMENT_MODE_LABELS, PaymentMode, fmt, getCustomerSummary
} from '../../hooks/useOrderStore';

const cn = (...c: (string|undefined|boolean)[]) => c.filter(Boolean).join(' ');

interface Props {
  store: ReturnType<typeof useOrderStore>;
  customerId?: string;
  onClose: () => void;
  onSaved: () => void;
}

type UnpaidRow = {
  id: string;
  type: 'manufacturer' | 'designer' | 'printing';
  number: string;
  description: string;
  grandTotal: number;
  outstanding: number;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function PaymentDrawer({ store, customerId: initialCustomerId, onClose, onSaved }: Props) {
  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [custSearch, setCustSearch] = useState('');
  const [custDropOpen, setCustDropOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState(0);
  const [payDate, setPayDate] = useState(today());
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'manufacturer' | 'designer' | 'printing'>('manufacturer');

  const selectedCustomer = store.state.customers.find(c => c.id === customerId);
  const summary = customerId ? getCustomerSummary(store.state, customerId) : null;
  const filteredCustomers = store.state.customers.filter(c =>
    !custSearch || c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.businessName.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch)
  );

  // All unpaid rows for this customer
  const unpaidRows: UnpaidRow[] = useMemo(() => {
    if (!customerId) return [];
    const rows: UnpaidRow[] = [];
    for (const o of store.state.manufacturerOrders.filter(x => x.customerId === customerId && x.outstanding > 0)) {
      rows.push({ id: o.id, type: 'manufacturer', number: o.orderNumber, description: o.teamName || 'Manufacturing Order', grandTotal: o.grandTotal, outstanding: o.outstanding });
    }
    for (const b of store.state.designerBills.filter(x => x.customerId === customerId && x.outstanding > 0)) {
      rows.push({ id: b.id, type: 'designer', number: b.billNumber, description: `Designer Bill${b.productionJobId ? ` — ${b.productionJobId}` : ''}`, grandTotal: b.grandTotal, outstanding: b.outstanding });
    }
    for (const o of store.state.printingOrders.filter(x => x.customerId === customerId && x.outstanding > 0)) {
      const svc = store.state.printingServices.find(s => s.id === o.serviceId);
      rows.push({ id: o.id, type: 'printing', number: o.orderNumber, description: svc?.name || 'Printing Order', grandTotal: o.grandTotal, outstanding: o.outstanding });
    }
    return rows;
  }, [customerId, store.state]);

  const selectedTotal = Array.from(selectedIds).reduce((s, id) => {
    const row = unpaidRows.find(r => r.id === id);
    return s + (row?.outstanding || 0);
  }, 0);

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  };

  const autoDistribute = () => {
    const selected = unpaidRows.filter(r => selectedIds.has(r.id));
    if (!selected.length || !amount) return;
    const newAlloc: Record<string, number> = {};
    let remaining = amount;
    selected.forEach((row, i) => {
      if (i === selected.length - 1) { newAlloc[row.id] = Math.round(remaining * 100) / 100; }
      else {
        const share = Math.round((row.outstanding / selectedTotal) * amount * 100) / 100;
        const actual = Math.min(share, row.outstanding);
        newAlloc[row.id] = actual;
        remaining -= actual;
      }
    });
    setAllocations(newAlloc);
  };

  const totalAllocated = Object.values(allocations).reduce((s, v) => s + v, 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerId) e.customer = 'Select a customer';
    if (!amount || amount <= 0) e.amount = 'Enter payment amount';
    if (selectedIds.size > 0) {
      const diff = Math.abs(totalAllocated - amount);
      if (diff > 0.5) e.alloc = `Allocations total ₹${totalAllocated.toFixed(0)} but payment is ₹${amount}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const allocs = selectedIds.size > 0
      ? unpaidRows.filter(r => selectedIds.has(r.id)).map(r => ({ orderId: r.id, orderType: r.type as 'manufacturer'|'designer'|'printing', amount: allocations[r.id] || r.outstanding }))
      : [];

    store.dispatch({
      type: 'ADD_PAYMENT',
      payload: { customerId, date: payDate, amount, mode, referenceNumber: reference, notes, receivedBy: 'Admin', allocations: allocs },
    });

    // Build WhatsApp message
    if (selectedCustomer) {
      const newOutstanding = (summary?.outstanding || 0) - amount;
      const msg = `Dear ${selectedCustomer.name}, we have received ₹${amount.toLocaleString('en-IN')} via ${PAYMENT_MODE_LABELS[mode]} on ${new Date(payDate).toLocaleDateString('en-IN')}. ${reference ? `Ref: ${reference}. ` : ''}Remaining balance: ₹${Math.max(0, newOutstanding).toLocaleString('en-IN')}. Thank you for your business! — FiveNest`;
      window.open(`https://wa.me/91${selectedCustomer.whatsapp || selectedCustomer.phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    onSaved();
  };

  const tabRows = (t: typeof activeTab) => unpaidRows.filter(r => r.type === t);
  const TYPE_BADGE: Record<string, string> = {
    manufacturer: 'bg-orange-50 text-orange-700 border-orange-200',
    designer: 'bg-purple-50 text-purple-700 border-purple-200',
    printing: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] shrink-0">
          <div>
            <h2 className="text-lg font-black text-[#171717] flex items-center gap-2"><CreditCard size={18} className="text-emerald-600"/>Receive Payment</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F5F3EF]"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Customer */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Customer *</label>
            <div className="relative">
              <div className="flex items-center border border-[#E8E4DE] rounded-xl overflow-hidden focus-within:border-emerald-500 bg-white">
                <Search size={14} className="ml-3 text-[#71717A] shrink-0"/>
                <input value={selectedCustomer ? selectedCustomer.businessName : custSearch}
                  onChange={e => { setCustSearch(e.target.value); setCustomerId(''); setCustDropOpen(true); setSelectedIds(new Set()); setAllocations({}); }}
                  onFocus={() => setCustDropOpen(true)} placeholder="Search customer..."
                  className="flex-1 px-3 py-2.5 text-sm outline-none"/>
                {customerId && <button onClick={() => { setCustomerId(''); setCustSearch(''); setSelectedIds(new Set()); }} className="mr-2"><X size={13} className="text-[#71717A]"/></button>}
              </div>
              <AnimatePresence>
                {custDropOpen && !customerId && (
                  <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
                    className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E8E4DE] rounded-xl shadow-xl z-20 max-h-44 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button key={c.id} onClick={() => { setCustomerId(c.id); setCustDropOpen(false); setCustSearch(''); setSelectedIds(new Set()); setAllocations({}); }}
                        className="flex w-full px-4 py-3 hover:bg-[#FAF8F5] text-left border-b border-[#F0EDE8] last:border-0">
                        <div><p className="text-sm font-semibold">{c.businessName}</p><p className="text-xs text-[#71717A]">{c.name} · {c.phone}</p></div>
                      </button>
                    ))}
                    {filteredCustomers.length === 0 && <p className="p-4 text-sm text-[#71717A] text-center">No customers found</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {errors.customer && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.customer}</p>}
          </div>

          {/* Outstanding summary */}
          {summary && (
            <div className="bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[#171717]">Total Outstanding</span>
                <span className="text-2xl font-black text-red-600">{fmt(summary.outstanding)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Mfg', val: summary.mfgOutstanding, cls: 'text-orange-600' },
                  { label: 'Designer', val: summary.dsgOutstanding, cls: 'text-purple-600' },
                  { label: 'Printing', val: summary.prtOutstanding, cls: 'text-blue-600' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold">{m.label}</p>
                    <p className={`font-black text-sm ${m.cls}`}>{fmt(m.val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unpaid invoices by tab */}
          {unpaidRows.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-2">Select Invoices to Pay</p>
              <div className="flex gap-1 mb-3">
                {(['manufacturer','designer','printing'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border transition-all', activeTab===t ? 'bg-[#171717] text-white border-[#171717]' : 'bg-white text-[#52525B] border-[#E8E4DE]')}>
                    {t.charAt(0).toUpperCase()+t.slice(1)} ({tabRows(t).length})
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {tabRows(activeTab).map(row => (
                  <label key={row.id} className={cn('flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all', selectedIds.has(row.id) ? 'border-emerald-300 bg-emerald-50' : 'border-[#E8E4DE] bg-white hover:bg-[#FAF8F5]')}>
                    <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleRow(row.id)} className="w-4 h-4 accent-emerald-600"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#171717] truncate">{row.number}</p>
                      <p className="text-xs text-[#71717A] truncate">{row.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[#71717A]">Outstanding</p>
                      <p className="font-black text-sm text-red-600">{fmt(row.outstanding)}</p>
                    </div>
                  </label>
                ))}
                {tabRows(activeTab).length === 0 && <p className="text-sm text-[#71717A] text-center py-4">No unpaid {activeTab} invoices</p>}
              </div>
              {selectedIds.size > 0 && (
                <p className="text-xs text-emerald-700 font-semibold mt-2">Selected: {selectedIds.size} invoice{selectedIds.size>1?'s':''} = {fmt(selectedTotal)} total</p>
              )}
            </div>
          )}

          {/* Payment amount */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Payment Amount (₹) *</label>
            <div className="flex items-center border border-[#E8E4DE] rounded-xl overflow-hidden focus-within:border-emerald-500 bg-white">
              <span className="px-3 text-lg font-bold text-[#71717A]">₹</span>
              <input type="number" min="0" value={amount || ''} onChange={e => setAmount(parseFloat(e.target.value)||0)}
                className="flex-1 py-3 pr-3 text-xl font-black outline-none" placeholder="0"/>
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.amount}</p>}
            {selectedIds.size > 0 && amount !== selectedTotal && (
              <button onClick={() => setAmount(selectedTotal)} className="text-xs text-emerald-700 font-semibold mt-1 hover:underline">
                Fill selected total ({fmt(selectedTotal)})
              </button>
            )}
          </div>

          {/* Payment mode */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Payment Mode</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_MODES.map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all', mode===m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-[#52525B] border-[#E8E4DE] hover:border-emerald-400')}>
                  {PAYMENT_MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Payment Date</label>
              <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-emerald-500"/>
            </div>
            {['upi','bank','cheque'].includes(mode) && (
              <div>
                <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Reference #</label>
                <input value={reference} onChange={e => setReference(e.target.value)} placeholder="UPI/NEFT Ref..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-emerald-500"/>
              </div>
            )}
          </div>

          {/* Allocation section */}
          {selectedIds.size > 1 && amount > 0 && (
            <div className="border border-[#E8E4DE] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#52525B]">Payment Allocation</p>
                <button onClick={autoDistribute} className="text-xs font-bold text-[#E4572E] hover:underline">Auto Distribute</button>
              </div>
              {errors.alloc && <p className="text-red-500 text-xs mb-2">{errors.alloc}</p>}
              {Array.from(selectedIds).map(id => {
                const row = unpaidRows.find(r => r.id === id);
                if (!row) return null;
                return (
                  <div key={id} className="flex items-center gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{row.number}</p>
                      <p className="text-[10px] text-[#71717A]">Outstanding: {fmt(row.outstanding)}</p>
                    </div>
                    <div className="flex items-center border border-[#E8E4DE] rounded-lg overflow-hidden w-32">
                      <span className="px-2 text-[#71717A] text-sm">₹</span>
                      <input type="number" min="0" max={row.outstanding} value={allocations[id] ?? ''}
                        onChange={e => setAllocations(prev => ({ ...prev, [id]: parseFloat(e.target.value)||0 }))}
                        className="flex-1 py-1.5 text-sm outline-none pr-2"/>
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-[#E8E4DE] pt-2 flex justify-between text-xs font-bold">
                <span>Total Allocated</span>
                <span className={totalAllocated === amount ? 'text-emerald-600' : 'text-red-600'}>{fmt(totalAllocated)}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm resize-none focus:outline-none focus:border-emerald-500"/>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E8E4DE] shrink-0 space-y-3">
          {summary && amount > 0 && (
            <div className="flex justify-between text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
              <span className="text-emerald-700 font-semibold">After payment, outstanding:</span>
              <span className="font-black text-emerald-700">{fmt(Math.max(0, (summary.outstanding || 0) - amount))}</span>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#52525B] hover:bg-[#F5F3EF]">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-sm">
              Record Payment + WhatsApp
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
