import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Trash2, AlertCircle, Settings, ShoppingBag } from 'lucide-react';
import {
  useOrderStore, PrintingService, PrintingOrder, PriceSlab,
  PAYMENT_MODES, PAYMENT_MODE_LABELS, PaymentMode, STATUS_COLORS, STATUS_LABELS, fmt, getEffectivePrintingRate
} from '../../hooks/useOrderStore';
import TransactionTable, { Column } from './TransactionTable';

const cn = (...c: (string|undefined|boolean)[]) => c.filter(Boolean).join(' ');
const today = () => new Date().toISOString().slice(0,10);
const addDays = (d: string, n: number) => { const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); };

interface Props {
  store: ReturnType<typeof useOrderStore>;
  onReceivePayment: (customerId: string) => void;
}

// ── Add/Edit Service Drawer ────────────────────────────────────────────────────
function ServiceDrawer({ store, svc, onClose }: { store: ReturnType<typeof useOrderStore>; svc?: PrintingService; onClose: () => void }) {
  const [name, setName] = useState(svc?.name || '');
  const [pricingMethod, setPricingMethod] = useState<PrintingService['pricingMethod']>(svc?.pricingMethod || 'per_piece');
  const [baseRate, setBaseRate] = useState(svc?.baseRate || 0);
  const [minQty, setMinQty] = useState(svc?.minQuantity || 1);
  const [minCharge, setMinCharge] = useState(svc?.minCharge || 0);
  const [rushCharge, setRushCharge] = useState(svc?.rushCharge || 0);
  const [setupCharge, setSetupCharge] = useState(svc?.setupCharge || 0);
  const [gstPct, setGstPct] = useState(svc?.gstPct || 12);
  const [active, setActive] = useState(svc?.active ?? true);
  const [slabs, setSlabs] = useState<PriceSlab[]>(svc?.slabs || [{ minQty: 1, maxQty: null, rate: 0 }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Service name is required';
    if (baseRate <= 0) e.baseRate = 'Base rate must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload = { name, pricingMethod, baseRate, slabs, minQuantity: minQty, minCharge, rushCharge, setupCharge, gstPct, active, customerRates: svc?.customerRates || [] };
    if (svc) store.dispatch({ type: 'UPDATE_PRINTING_SERVICE', payload: { ...svc, ...payload } });
    else store.dispatch({ type: 'ADD_PRINTING_SERVICE', payload });
    onClose();
  };

  const updateSlab = (i: number, updates: Partial<PriceSlab>) => {
    setSlabs(prev => prev.map((s, idx) => idx === i ? { ...s, ...updates } : s));
  };

  const PRICING_LABELS: Record<PrintingService['pricingMethod'], string> = {
    per_piece: 'Per Piece', per_meter: 'Per Meter', per_sqft: 'Per Sq.Ft',
    per_sqinch: 'Per Sq.Inch', per_design: 'Per Design', per_job: 'Per Job',
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{x:440}} animate={{x:0}} exit={{x:440}} transition={{type:'spring',damping:28,stiffness:280}}
        className="fixed right-0 top-0 bottom-0 w-[440px] bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] shrink-0">
          <h2 className="text-lg font-black text-[#171717]">{svc ? 'Edit Service' : 'Add Printing Type'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F5F3EF]"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Service Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Sublimation Printing"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
            {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Pricing Method</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PRICING_LABELS) as Array<PrintingService['pricingMethod']>).map(m => (
                <button key={m} onClick={() => setPricingMethod(m)}
                  className={cn('px-2 py-2 rounded-xl border text-xs font-bold transition-all', pricingMethod===m ? 'bg-[#E4572E] text-white border-[#E4572E]' : 'bg-white text-[#52525B] border-[#E8E4DE] hover:border-[#E4572E]/50')}>
                  {PRICING_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Base Rate (₹)', val: baseRate, set: setBaseRate, err: errors.baseRate },
              { label: 'Min Quantity', val: minQty, set: setMinQty },
              { label: 'Min Charge (₹)', val: minCharge, set: setMinCharge },
              { label: 'Rush Charge (₹)', val: rushCharge, set: setRushCharge },
              { label: 'Setup Charge (₹)', val: setupCharge, set: setSetupCharge },
              { label: 'GST %', val: gstPct, set: setGstPct },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">{f.label}</label>
                <input type="number" min="0" value={f.val || ''}
                  onChange={e => f.set(parseFloat(e.target.value)||0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
                {f.err && <p className="text-red-500 text-xs mt-0.5">{f.err}</p>}
              </div>
            ))}
          </div>

          {/* Quantity slabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#52525B]">Quantity Slabs</label>
              <button onClick={() => setSlabs(prev => [...prev, { minQty: (prev[prev.length-1]?.maxQty||0)+1, maxQty: null, rate: 0 }])}
                className="text-xs text-[#E4572E] font-bold flex items-center gap-1"><Plus size={12}/>Add Slab</button>
            </div>
            <div className="space-y-2">
              {slabs.map((slab, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="number" value={slab.minQty} onChange={e => updateSlab(i, {minQty: parseInt(e.target.value)||0})}
                    className="w-20 px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E]" placeholder="Min"/>
                  <span className="text-xs text-[#71717A]">–</span>
                  <input type="number" value={slab.maxQty ?? ''} onChange={e => updateSlab(i, {maxQty: e.target.value ? parseInt(e.target.value) : null})}
                    className="w-20 px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E]" placeholder="Max"/>
                  <span className="text-xs text-[#71717A]">@₹</span>
                  <input type="number" value={slab.rate} onChange={e => updateSlab(i, {rate: parseFloat(e.target.value)||0})}
                    className="w-20 px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E]" placeholder="Rate"/>
                  {slabs.length > 1 && <button onClick={() => setSlabs(prev => prev.filter((_,idx)=>idx!==i))}><Trash2 size={13} className="text-red-400"/></button>}
                </div>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button onClick={() => setActive(!active)}
              className={cn('relative w-11 h-6 rounded-full transition-all', active ? 'bg-[#E4572E]' : 'bg-[#D8D5CF]')}>
              <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{left: active ? '22px' : '2px'}}/>
            </button>
            <span className="text-sm font-semibold text-[#171717]">{active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#E8E4DE] shrink-0 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#52525B] hover:bg-[#F5F3EF]">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">Save</button>
        </div>
      </motion.div>
    </>
  );
}

// ── New Printing Order Drawer ──────────────────────────────────────────────────
function PrintingOrderDrawer({ store, onClose, onSaved }: { store: ReturnType<typeof useOrderStore>; onClose: () => void; onSaved: () => void }) {
  const [customerId, setCustomerId] = useState('');
  const [custSearch, setCustSearch] = useState('');
  const [custDropOpen, setCustDropOpen] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [material, setMaterial] = useState('Polyester');
  const [fabric, setFabric] = useState('');
  const [color, setColor] = useState('');
  const [printArea, setPrintArea] = useState('');
  const [artworkFile, setArtworkFile] = useState('');
  const [artworkApproved, setArtworkApproved] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [date, setDate] = useState(today());
  const [requiredDate, setRequiredDate] = useState(addDays(today(), 7));
  const [status, setStatus] = useState<PrintingOrder['status']>('received');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [gstPct, setGstPct] = useState(12);
  const [showAdvance, setShowAdvance] = useState(false);
  const [advAmount, setAdvAmount] = useState(0);
  const [advMode, setAdvMode] = useState<PaymentMode>('cash');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCustomer = store.state.customers.find(c => c.id === customerId);
  const selectedService = store.state.printingServices.find(s => s.id === serviceId);
  const filteredCustomers = store.state.customers.filter(c =>
    !custSearch || c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.businessName.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch)
  );

  const appliedRate = useMemo(() => {
    if (!selectedService) return 0;
    return getEffectivePrintingRate(selectedService, customerId, quantity);
  }, [selectedService, customerId, quantity]);

  const subtotal = appliedRate * quantity;
  const gstAmount = (subtotal + additionalCharges - discount) * gstPct / 100;
  const grandTotal = subtotal + additionalCharges - discount + gstAmount;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerId) e.customer = 'Select a customer';
    if (!serviceId) e.service = 'Select a printing service';
    if (!quantity || quantity <= 0) e.quantity = 'Quantity must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    store.dispatch({
      type: 'ADD_PRINTING_ORDER',
      payload: {
        customerId, serviceId, date, requiredDate, deliveryDate: '',
        status, paymentStatus: 'unpaid', quantity, appliedRate, material, fabric, color,
        printArea, artworkFile, artworkApproved, specialInstructions,
        subtotal, additionalCharges, discount, gstPct, gstAmount, grandTotal,
        totalPaid: 0, outstanding: grandTotal, notes: '',
      },
    });
    if (showAdvance && advAmount > 0) {
      setTimeout(() => {
        const newOrder = store.state.printingOrders[store.state.printingOrders.length - 1];
        if (newOrder) {
          store.dispatch({
            type: 'ADD_PAYMENT',
            payload: { customerId, date, amount: advAmount, mode: advMode, referenceNumber: '', notes: 'Advance', receivedBy: 'Admin', allocations: [{ orderId: newOrder.id, orderType: 'printing', amount: advAmount }] },
          });
        }
      }, 50);
    }
    onSaved();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{x:520}} animate={{x:0}} exit={{x:520}} transition={{type:'spring',damping:28,stiffness:280}}
        className="fixed right-0 top-0 bottom-0 w-[520px] bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] shrink-0">
          <h2 className="text-lg font-black text-[#171717]">New Printing Order</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F5F3EF]"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Customer */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Customer *</label>
            <div className="relative">
              <div className="flex items-center border border-[#E8E4DE] rounded-xl overflow-hidden focus-within:border-[#E4572E] bg-white">
                <Search size={14} className="ml-3 text-[#71717A] shrink-0"/>
                <input value={selectedCustomer ? selectedCustomer.businessName : custSearch}
                  onChange={e => { setCustSearch(e.target.value); setCustomerId(''); setCustDropOpen(true); }}
                  onFocus={() => setCustDropOpen(true)} placeholder="Search customer..." className="flex-1 px-3 py-2.5 text-sm outline-none"/>
                {customerId && <button onClick={() => { setCustomerId(''); setCustSearch(''); }} className="mr-2"><X size={13} className="text-[#71717A]"/></button>}
              </div>
              <AnimatePresence>
                {custDropOpen && !customerId && (
                  <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
                    className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E8E4DE] rounded-xl shadow-xl z-20 max-h-44 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button key={c.id} onClick={() => { setCustomerId(c.id); setCustDropOpen(false); setCustSearch(''); }}
                        className="flex w-full px-4 py-3 hover:bg-[#FAF8F5] text-left border-b border-[#F0EDE8] last:border-0">
                        <div><p className="text-sm font-semibold">{c.businessName}</p><p className="text-xs text-[#71717A]">{c.name} · {c.phone}</p></div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {errors.customer && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.customer}</p>}
          </div>

          {/* Printing Service */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Printing Type *</label>
            <select value={serviceId} onChange={e => setServiceId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]">
              <option value="">Select printing type...</option>
              {store.state.printingServices.filter(s => s.active).map(s => (
                <option key={s.id} value={s.id}>{s.name} — Base ₹{s.baseRate}</option>
              ))}
            </select>
            {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
          </div>

          {/* Quantity + auto-rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Quantity *</label>
              <input type="number" min="0" value={quantity||''} onChange={e => setQuantity(parseInt(e.target.value)||0)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Applied Rate (₹)</label>
              <div className="px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#FAF8F5] text-sm font-bold text-[#E4572E]">
                {appliedRate > 0 ? `₹${appliedRate} / piece` : '—'}
              </div>
              {selectedService && quantity > 0 && <p className="text-[10px] text-[#71717A] mt-0.5">Auto from slab pricing</p>}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Material', val: material, set: setMaterial },
              { label: 'Fabric', val: fabric, set: setFabric },
              { label: 'Color', val: color, set: setColor },
              { label: 'Print Area', val: printArea, set: setPrintArea },
              { label: 'Artwork File', val: artworkFile, set: setArtworkFile },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">{f.label}</label>
                <input value={f.val} onChange={e => f.set(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" checked={artworkApproved} onChange={e => setArtworkApproved(e.target.checked)} className="w-4 h-4 accent-[#E4572E]"/>
              <span className="text-sm text-[#171717]">Artwork Approved</span>
            </div>
          </div>

          {/* Dates + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Order Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Required Date</label>
              <input type="date" value={requiredDate} onChange={e => setRequiredDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as PrintingOrder['status'])}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]">
              {[['received','Received'],['quotation','Quotation'],['artwork_pending','Artwork Pending'],['printing','Printing'],['quality_check','Quality Check'],['ready','Ready'],['delivered','Delivered'],['cancelled','Cancelled']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {/* Pricing */}
          <div className="bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">Order Summary</h4>
            <div className="flex justify-between text-sm"><span className="text-[#52525B]">Subtotal ({quantity} × ₹{appliedRate})</span><span className="font-semibold">{fmt(subtotal)}</span></div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#52525B]">Additional Charges</span>
              <input type="number" min="0" value={additionalCharges||''} onChange={e => setAdditionalCharges(parseFloat(e.target.value)||0)}
                className="w-24 px-2 py-1 rounded-lg border border-[#E8E4DE] text-sm text-right bg-white focus:outline-none focus:border-[#E4572E]"/>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#52525B]">Discount (₹)</span>
              <input type="number" min="0" value={discount||''} onChange={e => setDiscount(parseFloat(e.target.value)||0)}
                className="w-24 px-2 py-1 rounded-lg border border-[#E8E4DE] text-sm text-right bg-white focus:outline-none focus:border-[#E4572E]"/>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-[#52525B]">GST <select value={gstPct} onChange={e => setGstPct(Number(e.target.value))} className="px-1.5 py-0.5 rounded-lg border border-[#E8E4DE] text-xs bg-white">{[0,5,12,18].map(g => <option key={g} value={g}>{g}%</option>)}</select></span>
              <span className="font-semibold">{fmt(gstAmount)}</span>
            </div>
            <div className="border-t border-[#E8E4DE] pt-2 flex justify-between">
              <span className="font-black text-[#171717]">Grand Total</span>
              <span className="text-xl font-black text-[#E4572E]">{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Advance */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setShowAdvance(!showAdvance)} className={cn('relative w-11 h-6 rounded-full transition-all', showAdvance ? 'bg-[#E4572E]' : 'bg-[#D8D5CF]')}>
                <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{left: showAdvance ? '22px' : '2px'}}/>
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
                      <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Mode</label>
                      <select value={advMode} onChange={e => setAdvMode(e.target.value as PaymentMode)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]">
                        {PAYMENT_MODES.map(m => <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>)}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#E8E4DE] shrink-0 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#52525B] hover:bg-[#F5F3EF]">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">Save Order</button>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Printing Module ───────────────────────────────────────────────────────
export default function PrintingModule({ store, onReceivePayment }: Props) {
  const [tab, setTab] = useState<'rates' | 'orders'>('orders');
  const [showServiceDrawer, setShowServiceDrawer] = useState(false);
  const [editService, setEditService] = useState<PrintingService | undefined>();
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);

  const orderColumns: Column<PrintingOrder>[] = [
    { key: 'orderNumber', label: 'Order #', sortable: true },
    { key: 'customerId', label: 'Customer', render: (row) => {
      const c = store.state.customers.find(x => x.id === row.customerId);
      return <span className="font-semibold">{c?.businessName || '—'}</span>;
    }},
    { key: 'serviceId', label: 'Printing Type', render: (row) => {
      const s = store.state.printingServices.find(x => x.id === row.serviceId);
      return <span>{s?.name || '—'}</span>;
    }},
    { key: 'quantity', label: 'Qty', sortable: true, render: (row) => <span>{row.quantity.toLocaleString()}</span> },
    { key: 'appliedRate', label: 'Rate', render: (row) => <span>₹{row.appliedRate}</span> },
    { key: 'grandTotal', label: 'Total', sortable: true, render: (row) => <span className="font-semibold">{fmt(row.grandTotal)}</span> },
    { key: 'totalPaid', label: 'Paid', render: (row) => <span className="text-emerald-600 font-semibold">{fmt(row.totalPaid)}</span> },
    { key: 'outstanding', label: 'Outstanding', render: (row) => <span className={row.outstanding > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>{fmt(row.outstanding)}</span> },
    { key: 'status', label: 'Status', render: (row) => (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border', STATUS_COLORS[row.status])}>
        {STATUS_LABELS[row.status]}
      </span>
    )},
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl p-1 w-fit">
        {[
          { key: 'orders', label: 'Orders', icon: ShoppingBag },
          { key: 'rates', label: 'Rate Cards', icon: Settings },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all', tab===t.key ? 'bg-white shadow-sm text-[#171717]' : 'text-[#71717A] hover:text-[#171717]')}>
              <Icon size={15}/>{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowOrderDrawer(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm">
              <Plus size={16}/> New Printing Order
            </button>
          </div>
          <TransactionTable
            columns={orderColumns} rows={store.state.printingOrders}
            actions={['view','payment','delete']}
            onAction={(action, row) => {
              if (action === 'payment') onReceivePayment(row.customerId);
              if (action === 'delete') { if(confirm(`Delete ${row.orderNumber}?`)) store.dispatch({ type: 'DELETE_PRINTING_ORDER', payload: row.id }); }
            }}
            emptyTitle="No Printing Orders" emptyDesc="Create your first printing order."
            onAdd={() => setShowOrderDrawer(true)} addLabel="+ New Printing Order"
          />
        </div>
      )}

      {tab === 'rates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setEditService(undefined); setShowServiceDrawer(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E4572E] text-white text-sm font-bold hover:bg-[#D4431B] shadow-sm">
              <Plus size={16}/> Add Printing Type
            </button>
          </div>
          {store.state.printingServices.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#E8E4DE] rounded-2xl">
              <Settings size={40} className="mx-auto text-[#D8D5CF] mb-3"/>
              <p className="font-semibold text-[#52525B]">No Printing Services Added</p>
              <p className="text-sm text-[#71717A] mt-1">Create your printing rate card first.</p>
              <button onClick={() => setShowServiceDrawer(true)} className="mt-4 px-4 py-2 rounded-xl bg-[#E4572E] text-white text-sm font-bold">+ Add Printing Type</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {store.state.printingServices.map(svc => (
                <div key={svc.id} className="bg-white border border-[#E8E4DE] rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-[#171717]">{svc.name}</h3>
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border mt-1 inline-block', svc.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200')}>
                        {svc.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditService(svc); setShowServiceDrawer(true); }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FAF8F5] border border-[#E8E4DE] hover:border-[#E4572E]/40">Edit</button>
                      <button onClick={() => { if(confirm(`Delete ${svc.name}?`)) store.dispatch({type:'DELETE_PRINTING_SERVICE',payload:svc.id}); }}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-[#71717A] text-xs uppercase tracking-wider font-semibold mb-1">Pricing</p>
                    <p className="font-black text-2xl text-[#E4572E]">₹{svc.baseRate}<span className="text-sm font-semibold text-[#71717A]"> / {svc.pricingMethod.replace(/_/g,' ')}</span></p>
                  </div>
                  {svc.slabs.length > 0 && (
                    <div>
                      <p className="text-xs text-[#71717A] font-semibold uppercase tracking-wider mb-1">Quantity Slabs</p>
                      <div className="space-y-0.5">
                        {svc.slabs.map((slab, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-[#52525B]">{slab.minQty}{slab.maxQty ? `–${slab.maxQty}` : '+'} pcs</span>
                            <span className="font-bold text-[#171717]">₹{slab.rate}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {svc.gstPct > 0 && <p className="text-xs text-[#71717A]">GST: {svc.gstPct}%</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showServiceDrawer && (
          <ServiceDrawer store={store} svc={editService} onClose={() => { setShowServiceDrawer(false); setEditService(undefined); }} />
        )}
        {showOrderDrawer && (
          <PrintingOrderDrawer store={store} onClose={() => setShowOrderDrawer(false)} onSaved={() => setShowOrderDrawer(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
