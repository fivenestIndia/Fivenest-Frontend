import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, MoreVertical, ChevronRight, Factory, Palette, Printer,
  Phone, Mail, MapPin, User, Trash2, Eye, CreditCard, AlertTriangle, BookOpen
} from 'lucide-react';
import {
  useOrderStore, Customer, fmt, BusinessType, getCustomerSummary, getCustomerLedger
} from '../../hooks/useOrderStore';

const cn = (...c: (string|undefined|boolean)[]) => c.filter(Boolean).join(' ');

interface Props {
  store: ReturnType<typeof useOrderStore>;
  onNewMfgOrder: (customerId: string) => void;
  onNewDesignerBill: (customerId: string) => void;
  onNewPrintingOrder: (customerId: string) => void;
  onReceivePayment: (customerId: string) => void;
  onViewLedger?: (customerId: string) => void;
}

const SERVICE_BADGE: Record<BusinessType, { label: string; cls: string }> = {
  manufacturer: { label: 'M', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  designer:     { label: 'D', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  printing:     { label: 'P', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
};

// ── Add Customer Drawer ───────────────────────────────────────────────────────
function AddCustomerDrawer({
  store, onClose,
}: { store: ReturnType<typeof useOrderStore>; onClose: () => void }) {
  const INIT = {
    name: '', businessName: '', phone: '', whatsapp: '', email: '',
    gstin: '', billingAddress: '', shippingAddress: '', state: '',
    customerType: 'direct' as Customer['customerType'],
    openingBalance: 0, openingBalanceDate: new Date().toISOString().slice(0, 10),
    notes: '',
  };
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dup, setDup] = useState<Customer | null>(null);

  const set = (k: keyof typeof INIT, v: string | number) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'phone') {
      const existing = store.state.customers.find(c => c.phone === v);
      setDup(existing || null);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.businessName.trim()) e.businessName = 'Business name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    store.dispatch({ type: 'ADD_CUSTOMER', payload: form });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE]">
          <h2 className="text-lg font-bold text-[#171717]">Add Customer</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5F3EF]"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {dup && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
              <p className="font-semibold text-amber-800 flex items-center gap-1.5"><AlertTriangle size={14}/> Customer may already exist</p>
              <p className="text-amber-700 mt-0.5">{dup.businessName} — {dup.name} ({dup.phone})</p>
            </div>
          )}

          {[
            { k: 'name',         label: 'Customer Name *',    type: 'text'   },
            { k: 'businessName', label: 'Business Name *',    type: 'text'   },
            { k: 'phone',        label: 'Phone *',            type: 'tel'    },
            { k: 'whatsapp',     label: 'WhatsApp',           type: 'tel'    },
            { k: 'email',        label: 'Email',              type: 'email'  },
            { k: 'gstin',        label: 'GSTIN',              type: 'text'   },
            { k: 'billingAddress', label: 'Billing Address',  type: 'text'   },
            { k: 'state',        label: 'State',              type: 'text'   },
          ].map(({ k, label, type }) => (
            <div key={k}>
              <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">{label}</label>
              <input
                type={type} value={(form as Record<string,unknown>)[k] as string}
                onChange={e => set(k as keyof typeof INIT, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E] focus:ring-1 focus:ring-[#E4572E]/20"
              />
              {errors[k] && <p className="text-red-500 text-xs mt-0.5">{errors[k]}</p>}
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Customer Type</label>
            <div className="flex gap-2">
              {(['direct','retailer','wholesaler'] as const).map(t => (
                <button key={t} onClick={() => set('customerType', t)}
                  className={cn('px-3 py-1.5 rounded-lg text-sm font-medium border transition-all', form.customerType === t ? 'bg-[#E4572E] text-white border-[#E4572E]' : 'bg-white text-[#52525B] border-[#E8E4DE] hover:border-[#E4572E]/40')}
                >{t.charAt(0).toUpperCase()+t.slice(1)}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Opening Balance (₹)</label>
              <input type="number" value={form.openingBalance}
                onChange={e => set('openingBalance', parseFloat(e.target.value)||0)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">As of Date</label>
              <input type="date" value={form.openingBalanceDate}
                onChange={e => set('openingBalanceDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm resize-none focus:outline-none focus:border-[#E4572E]"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E8E4DE] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#52525B] hover:bg-[#F5F3EF]">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-[#E4572E] text-white text-sm font-bold hover:bg-[#D4431B]">Save Customer</button>
        </div>
      </motion.div>
    </>
  );
}

// ── Customer Profile Drawer ────────────────────────────────────────────────────
function CustomerProfileDrawer({
  store, customer, onClose,
  onNewMfgOrder, onNewDesignerBill, onNewPrintingOrder, onReceivePayment, onViewLedger,
}: {
  store: ReturnType<typeof useOrderStore>; customer: Customer; onClose: () => void;
  onNewMfgOrder: () => void; onNewDesignerBill: () => void;
  onNewPrintingOrder: () => void; onReceivePayment: () => void;
  onViewLedger?: () => void;
}) {
  const summary = getCustomerSummary(store.state, customer.id);
  const ledger = getCustomerLedger(store.state, customer.id).slice(-8).reverse();

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: 560 }} animate={{ x: 0 }} exit={{ x: 560 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-[560px] bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="px-6 py-4 border-b border-[#E8E4DE] flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-[#171717]">{customer.businessName}</h2>
            <p className="text-sm text-[#52525B]">{customer.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F5F3EF] mt-1"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E4DE]">
              <span className="text-[10px] uppercase font-bold text-[#71717A] block">Total Business</span>
              <span className="text-lg font-black text-[#171717]">{fmt(summary.totalBusiness)}</span>
            </div>
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E4DE]">
              <span className="text-[10px] uppercase font-bold text-[#71717A] block">Total Paid</span>
              <span className="text-lg font-black text-emerald-600">{fmt(summary.totalPaid)}</span>
            </div>
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E4DE]">
              <span className="text-[10px] uppercase font-bold text-[#71717A] block">Outstanding</span>
              <span className={`text-lg font-black ${summary.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {fmt(summary.outstanding)}
              </span>
            </div>
          </div>

          {/* Contact & addresses */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#52525B]">
              <Phone size={14}/><span>{customer.phone}</span>
              {customer.whatsapp && <span className="text-emerald-600">(WA: {customer.whatsapp})</span>}
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-[#52525B]">
                <Mail size={14}/><span>{customer.email}</span>
              </div>
            )}
            {customer.gstin && (
              <div className="flex items-center gap-2 text-[#52525B]">
                <span className="font-bold">GSTIN:</span><span className="font-mono">{customer.gstin}</span>
              </div>
            )}
            {customer.billingAddress && (
              <div className="flex items-start gap-2 text-[#52525B]">
                <MapPin size={14} className="shrink-0 mt-0.5"/><span>{customer.billingAddress}</span>
              </div>
            )}
          </div>

          {/* Business-wise breakdown */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#71717A]">Business Summary</div>
            {[
              { label: 'Manufacturer Orders', total: summary.mfgTotal, paid: summary.mfgPaid, out: summary.mfgOutstanding, color: 'text-orange-600' },
              { label: 'Designer Bills', total: summary.dsgTotal, paid: summary.dsgPaid, out: summary.dsgOutstanding, color: 'text-purple-600' },
              { label: 'Printing Orders', total: summary.prtTotal, paid: summary.prtPaid, out: summary.prtOutstanding, color: 'text-blue-600' },
            ].map(b => (
              <div key={b.label} className="flex items-center justify-between py-2 border-b border-[#F0EDE8] text-xs">
                <span className="font-semibold text-[#171717]">{b.label}</span>
                <div className="flex gap-4">
                  <span className="text-[#71717A]">Total: {fmt(b.total)}</span>
                  <span className="text-emerald-600">Paid: {fmt(b.paid)}</span>
                  <span className={`font-bold ${b.out > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Due: {fmt(b.out)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent ledger */}
          {ledger.length > 0 && (
            <div className="border border-[#E8E4DE] rounded-xl overflow-hidden">
              <div className="bg-[#FAF8F5] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#71717A] flex items-center justify-between">
                <span>Recent Transactions</span>
                {onViewLedger && (
                  <button
                    onClick={() => { onViewLedger(); onClose(); }}
                    className="text-[#E4572E] hover:underline font-bold text-xs flex items-center gap-1"
                  >
                    Open Full Ledger →
                  </button>
                )}
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-t border-[#E8E4DE]">
                    {['Date','Description','Debit','Credit','Balance'].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-[#71717A] font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.map(e => (
                    <tr key={e.id} className="border-t border-[#E8E4DE] hover:bg-[#FAF8F5]">
                      <td className="px-4 py-2 text-[#71717A]">{new Date(e.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</td>
                      <td className="px-4 py-2 max-w-[160px] truncate" title={e.description}>{e.description}</td>
                      <td className="px-4 py-2 text-amber-700 font-semibold">{e.transactionType==='debit'?fmt(e.amount):'—'}</td>
                      <td className="px-4 py-2 text-emerald-600 font-semibold">{e.transactionType==='credit'?fmt(e.amount):'—'}</td>
                      <td className={`px-4 py-2 font-bold ${e.balance>0?'text-red-600':'text-emerald-600'}`}>{fmt(Math.abs(e.balance))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="px-6 py-4 border-t border-[#E8E4DE] grid grid-cols-2 gap-2">
          {onViewLedger && (
            <button onClick={() => { onViewLedger(); onClose(); }}
              className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-all shadow-sm">
              <BookOpen size={14}/> View Full Customer Ledger
            </button>
          )}
          <button onClick={() => { onNewMfgOrder(); onClose(); }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold hover:bg-orange-100">
            <Factory size={13}/> New Mfg Order
          </button>
          <button onClick={() => { onNewDesignerBill(); onClose(); }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold hover:bg-purple-100">
            <Palette size={13}/> New Designer Bill
          </button>
          <button onClick={() => { onNewPrintingOrder(); onClose(); }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100">
            <Printer size={13}/> New Printing Order
          </button>
          <button onClick={() => { onReceivePayment(); onClose(); }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100">
            <CreditCard size={13}/> Receive Payment
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Customer Panel ────────────────────────────────────────────────────────
export default function CustomerPanel({
  store, onNewMfgOrder, onNewDesignerBill, onNewPrintingOrder, onReceivePayment, onViewLedger
}: Props) {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const filtered = store.state.customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.businessName.toLowerCase().includes(q)
      || c.phone.includes(q) || c.gstin.toLowerCase().includes(q);
  });

  const profileCustomer = store.state.customers.find(c => c.id === profileId);

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, GSTIN..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E] bg-white"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E4572E] text-white text-sm font-bold hover:bg-[#D4431B] shadow-sm transition-all"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Customer table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#E8E4DE] rounded-2xl">
          <User size={40} className="mx-auto text-[#D8D5CF] mb-3" />
          <p className="font-semibold text-[#52525B]">No Customers Found</p>
          <p className="text-sm text-[#71717A] mt-1">Add your first customer to get started.</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 rounded-xl bg-[#E4572E] text-white text-sm font-bold">+ Add Customer</button>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E8E4DE]">
                {['Customer / Business', 'Phone', 'Services', 'Total Business', 'Outstanding', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[#71717A]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const summary = getCustomerSummary(store.state, c.id);
                return (
                  <tr key={c.id} className="border-t border-[#E8E4DE] hover:bg-[#FAF8F5] transition-colors relative">
                    <td className="px-4 py-3">
                      <button onClick={() => setProfileId(c.id)} className="text-left hover:text-[#E4572E] transition-colors">
                        <p className="font-bold text-sm text-[#171717]">{c.businessName}</p>
                        <p className="text-xs text-[#71717A]">{c.name}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#52525B]">{c.phone}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {summary.services.map(s => (
                          <span key={s} className={cn('w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-black border', SERVICE_BADGE[s].cls)}>
                            {SERVICE_BADGE[s].label}
                          </span>
                        ))}
                        {summary.services.length === 0 && <span className="text-xs text-[#71717A]">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#171717]">{fmt(summary.totalBusiness)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${summary.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {fmt(summary.outstanding)}
                      </span>
                    </td>
                    <td className="px-4 py-3 relative">
                      <button onClick={() => setMenuId(menuId === c.id ? null : c.id)}
                        className="p-1.5 rounded-lg hover:bg-[#F0EDE8]">
                        <MoreVertical size={16} className="text-[#71717A]" />
                      </button>
                      <AnimatePresence>
                        {menuId === c.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#E8E4DE] rounded-xl shadow-xl z-30 overflow-hidden"
                            onMouseLeave={() => setMenuId(null)}
                          >
                            {[
                              { label: 'View Profile', icon: Eye, action: () => { setProfileId(c.id); setMenuId(null); } },
                              { label: 'View Ledger', icon: BookOpen, action: () => { onViewLedger?.(c.id); setMenuId(null); } },
                              { label: 'New Mfg Order', icon: Factory, action: () => { onNewMfgOrder(c.id); setMenuId(null); } },
                              { label: 'New Designer Bill', icon: Palette, action: () => { onNewDesignerBill(c.id); setMenuId(null); } },
                              { label: 'New Printing Order', icon: Printer, action: () => { onNewPrintingOrder(c.id); setMenuId(null); } },
                              { label: 'Receive Payment', icon: CreditCard, action: () => { onReceivePayment(c.id); setMenuId(null); } },
                              { label: 'Delete', icon: Trash2, action: () => { if(confirm(`Delete ${c.businessName}?`)) store.dispatch({type:'DELETE_CUSTOMER',payload:c.id}); setMenuId(null); }, cls: 'text-red-600 hover:bg-red-50' },
                            ].map(item => {
                              const Icon = item.icon;
                              return (
                                <button key={item.label} onClick={item.action}
                                  className={cn('flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#171717] hover:bg-[#F5F3EF] text-left', item.cls)}>
                                  <Icon size={14}/>{item.label}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawers */}
      <AnimatePresence>
        {showAdd && <AddCustomerDrawer store={store} onClose={() => setShowAdd(false)} />}
        {profileId && profileCustomer && (
          <CustomerProfileDrawer
            store={store} customer={profileCustomer} onClose={() => setProfileId(null)}
            onNewMfgOrder={() => onNewMfgOrder(profileCustomer.id)}
            onNewDesignerBill={() => onNewDesignerBill(profileCustomer.id)}
            onNewPrintingOrder={() => onNewPrintingOrder(profileCustomer.id)}
            onReceivePayment={() => onReceivePayment(profileCustomer.id)}
            onViewLedger={() => onViewLedger?.(profileCustomer.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
