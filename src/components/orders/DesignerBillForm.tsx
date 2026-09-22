import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  useOrderStore, DesignerBill, DesignerBillItem,
  PAYMENT_MODES, PAYMENT_MODE_LABELS, PaymentMode, fmt
} from '../../hooks/useOrderStore';

const cn = (...c: (string|undefined|boolean)[]) => c.filter(Boolean).join(' ');

interface Props {
  store: ReturnType<typeof useOrderStore>;
  prefillCustomerId?: string;
  prefillJobId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const SERVICE_TYPES: Array<{ value: DesignerBillItem['type']; label: string }> = [
  { value: 'design', label: 'Base Design' },
  { value: 'revision', label: 'Revision' },
  { value: 'urgent', label: 'Urgent Charge' },
  { value: 'mockup', label: 'Mockup' },
  { value: 'logo', label: 'Logo Design' },
  { value: 'pattern', label: 'Pattern Design' },
  { value: 'source_file', label: 'Source File' },
  { value: 'other', label: 'Other' },
];

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d: string, n: number) => { const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); };

const EMPTY_ITEM = (): DesignerBillItem => ({
  id: Math.random().toString(36).slice(2), type: 'design', description: '', amount: 0,
});

export default function DesignerBillForm({ store, prefillCustomerId, prefillJobId, onClose, onSaved }: Props) {
  const [customerId, setCustomerId] = useState(prefillCustomerId || '');
  const [custSearch, setCustSearch] = useState('');
  const [custDropOpen, setCustDropOpen] = useState(false);
  const [productionJobId, setProductionJobId] = useState(prefillJobId || '');
  const [date, setDate] = useState(today());
  const [dueDate, setDueDate] = useState(addDays(today(), 15));
  const [items, setItems] = useState<DesignerBillItem[]>([EMPTY_ITEM()]);
  const [discount, setDiscount] = useState(0);
  const [gstPct, setGstPct] = useState(18);
  const [notes, setNotes] = useState('');
  const [showAdvance, setShowAdvance] = useState(false);
  const [advAmount, setAdvAmount] = useState(0);
  const [advMode, setAdvMode] = useState<PaymentMode>('cash');
  const [advRef, setAdvRef] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCustomer = store.state.customers.find(c => c.id === customerId);
  const filteredCustomers = store.state.customers.filter(c =>
    !custSearch || c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.businessName.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone.includes(custSearch)
  );

  const subtotal = items.reduce((s, i) => s + (i.amount||0), 0) - discount;
  const gstAmount = subtotal * gstPct / 100;
  const grandTotal = subtotal + gstAmount;

  const updateItem = (id: string, updates: Partial<DesignerBillItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerId) e.customer = 'Please select a customer';
    if (items.every(i => i.amount === 0)) e.items = 'At least one service with amount is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    store.dispatch({
      type: 'ADD_DESIGNER_BILL',
      payload: {
        customerId, productionJobId, date, dueDate, status: 'sent', paymentStatus: 'unpaid',
        items, discount, gstPct, gstAmount, grandTotal, totalPaid: 0, outstanding: grandTotal, notes,
      },
    });
    if (showAdvance && advAmount > 0) {
      setTimeout(() => {
        const newBill = store.state.designerBills[store.state.designerBills.length - 1];
        if (newBill) {
          store.dispatch({
            type: 'ADD_PAYMENT',
            payload: {
              customerId, date, amount: advAmount, mode: advMode, referenceNumber: advRef,
              notes: 'Advance payment', receivedBy: 'Admin',
              allocations: [{ orderId: newBill.id, orderType: 'designer', amount: advAmount }],
            },
          });
        }
      }, 50);
    }
    onSaved();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: 520 }} animate={{ x: 0 }} exit={{ x: 520 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-[520px] bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] shrink-0">
          <div>
            <h2 className="text-lg font-black text-[#171717]">New Designer Bill</h2>
            <p className="text-xs text-[#71717A]">Create a bill for design services</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F5F3EF]"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Customer */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Customer *</label>
            <div className="relative">
              <div className="flex items-center border border-[#E8E4DE] rounded-xl overflow-hidden focus-within:border-[#E4572E] focus-within:ring-1 focus-within:ring-[#E4572E]/20 bg-white">
                <Search size={14} className="ml-3 text-[#71717A] shrink-0"/>
                <input
                  value={selectedCustomer ? selectedCustomer.businessName : custSearch}
                  onChange={e => { setCustSearch(e.target.value); setCustomerId(''); setCustDropOpen(true); }}
                  onFocus={() => setCustDropOpen(true)}
                  placeholder="Search customer..."
                  className="flex-1 px-3 py-2.5 text-sm outline-none"
                />
                {customerId && <button onClick={() => { setCustomerId(''); setCustSearch(''); }} className="mr-2"><X size={13} className="text-[#71717A]"/></button>}
              </div>
              <AnimatePresence>
                {custDropOpen && !customerId && (
                  <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
                    className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E8E4DE] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button key={c.id} onClick={() => { setCustomerId(c.id); setCustDropOpen(false); setCustSearch(''); }}
                        className="flex items-start w-full px-4 py-3 hover:bg-[#FAF8F5] text-left border-b border-[#F0EDE8] last:border-0">
                        <div>
                          <p className="text-sm font-semibold text-[#171717]">{c.businessName}</p>
                          <p className="text-xs text-[#71717A]">{c.name} · {c.phone}</p>
                        </div>
                      </button>
                    ))}
                    {filteredCustomers.length === 0 && <p className="p-4 text-sm text-[#71717A] text-center">No customers found</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {errors.customer && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.customer}</p>}
          </div>

          {/* Production Job ID */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Production Job # (optional)</label>
            <input value={productionJobId} onChange={e => setProductionJobId(e.target.value)}
              placeholder="e.g. JOB-1024"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
            <p className="text-xs text-[#71717A] mt-1">Link this bill to a production job for auto-tracking</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Bill Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
            </div>
          </div>

          {/* Services */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-2 block">Design Services *</label>
            {errors.items && <p className="text-red-500 text-xs mb-2 flex items-center gap-1"><AlertCircle size={12}/>{errors.items}</p>}
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-3 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl">
                  <select value={item.type} onChange={e => updateItem(item.id, { type: e.target.value as DesignerBillItem['type'] })}
                    className="px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-xs bg-white focus:outline-none focus:border-[#E4572E] shrink-0">
                    {SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input value={item.description} onChange={e => updateItem(item.id, { description: e.target.value })}
                    placeholder="Description..." className="flex-1 px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-sm bg-white focus:outline-none focus:border-[#E4572E]"/>
                  <div className="flex items-center border border-[#E8E4DE] rounded-lg bg-white overflow-hidden shrink-0 w-28">
                    <span className="px-2 text-[#71717A] text-sm">₹</span>
                    <input type="number" min="0" value={item.amount || ''}
                      onChange={e => updateItem(item.id, { amount: parseFloat(e.target.value)||0 })}
                      className="flex-1 py-1.5 text-sm focus:outline-none pr-2"/>
                  </div>
                  {items.length > 1 && (
                    <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                      className="p-1 text-red-400 hover:text-red-600 shrink-0"><Trash2 size={14}/></button>
                  )}
                </div>
              ))}
              <button onClick={() => setItems(prev => [...prev, EMPTY_ITEM()])}
                className="w-full py-2.5 border-2 border-dashed border-[#E8E4DE] rounded-xl text-sm font-semibold text-[#71717A] hover:border-[#E4572E]/40 hover:text-[#E4572E] flex items-center justify-center gap-2 transition-all">
                <Plus size={15}/> Add Service
              </button>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A] mb-3">Bill Summary</h4>
            {[
              { label: 'Services Total', val: fmt(items.reduce((s,i) => s+(i.amount||0), 0)), readOnly: true },
            ].map(f => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className="text-[#52525B]">{f.label}</span>
                <span className="font-semibold text-[#171717]">{f.val}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#52525B]">Discount (₹)</span>
              <input type="number" min="0" value={discount || ''}
                onChange={e => setDiscount(parseFloat(e.target.value)||0)}
                className="w-24 px-2 py-1 rounded-lg border border-[#E8E4DE] text-sm text-right bg-white focus:outline-none focus:border-[#E4572E]"/>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-[#52525B]">
                GST
                <select value={gstPct} onChange={e => setGstPct(Number(e.target.value))}
                  className="px-1.5 py-0.5 rounded-lg border border-[#E8E4DE] text-xs bg-white">
                  {[0,5,12,18].map(g => <option key={g} value={g}>{g}%</option>)}
                </select>
              </span>
              <span className="font-semibold text-[#171717]">{fmt(gstAmount)}</span>
            </div>
            <div className="border-t border-[#E8E4DE] pt-2 flex justify-between">
              <span className="font-black text-[#171717]">Grand Total</span>
              <span className="text-xl font-black text-[#E4572E]">{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm resize-none focus:outline-none focus:border-[#E4572E]"/>
          </div>

          {/* Advance payment toggle */}
          <div className="border-t border-[#E8E4DE] pt-4">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setShowAdvance(!showAdvance)}
                className={cn('relative w-11 h-6 rounded-full transition-all', showAdvance ? 'bg-[#E4572E]' : 'bg-[#D8D5CF]')}>
                <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all')} style={{left: showAdvance ? '22px' : '2px'}}/>
              </button>
              <span className="text-sm font-semibold text-[#171717]">Add Advance Payment?</span>
            </div>
            <AnimatePresence>
              {showAdvance && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Amount (₹)</label>
                      <input type="number" value={advAmount||''} onChange={e => setAdvAmount(parseFloat(e.target.value)||0)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Reference</label>
                      <input value={advRef} onChange={e => setAdvRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]" placeholder="Ref #"/>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_MODES.map(m => (
                      <button key={m} onClick={() => setAdvMode(m)}
                        className={cn('px-3 py-1 rounded-full text-xs font-bold border', advMode===m ? 'bg-[#E4572E] text-white border-[#E4572E]' : 'bg-white text-[#52525B] border-[#E8E4DE]')}>
                        {PAYMENT_MODE_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E8E4DE] shrink-0 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#52525B] hover:bg-[#F5F3EF]">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 shadow-sm">
            Save Designer Bill
          </button>
        </div>
      </motion.div>
    </>
  );
}
