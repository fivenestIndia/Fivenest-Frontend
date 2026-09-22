import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronDown, ChevronUp, Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  useOrderStore, ManufacturerOrder, OrderItem, Customer, SIZES,
  PAYMENT_MODES, PAYMENT_MODE_LABELS, PaymentMode, fmt
} from '../../hooks/useOrderStore';

const cn = (...c: (string|undefined|boolean)[]) => c.filter(Boolean).join(' ');

interface Props {
  store: ReturnType<typeof useOrderStore>;
  editOrder?: ManufacturerOrder | null;
  prefillCustomerId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_ITEM = (): OrderItem => ({
  id: Math.random().toString(36).slice(2),
  product: '', category: '', sku: '',
  sizes: {}, totalQty: 0, rate: 0, discount: 0, taxPct: 18, amount: 0,
});

const calcItemAmount = (item: OrderItem) => {
  const qty = Object.values(item.sizes).reduce((s, v) => s + (v || 0), 0);
  const sub = qty * (item.rate || 0);
  const afterDisc = sub * (1 - (item.discount || 0) / 100);
  return { qty, amount: afterDisc * (1 + (item.taxPct || 0) / 100) };
};

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d: string, n: number) => {
  const date = new Date(d); date.setDate(date.getDate() + n);
  return date.toISOString().slice(0, 10);
};

export default function OrderForm({ store, editOrder, prefillCustomerId, onClose, onSaved }: Props) {
  // Customer
  const [custSearch, setCustSearch] = useState('');
  const [customerId, setCustomerId] = useState(prefillCustomerId || editOrder?.customerId || '');
  const [custDropOpen, setCustDropOpen] = useState(false);

  // Order info
  const [orderDate, setOrderDate] = useState(editOrder?.orderDate || today());
  const [deliveryDate, setDeliveryDate] = useState(editOrder?.deliveryDate || addDays(today(), 14));
  const [dueDate, setDueDate] = useState(editOrder?.dueDate || addDays(today(), 29));
  const [priority, setPriority] = useState<'normal'|'urgent'|'express'>(editOrder?.priority || 'normal');
  const [status, setStatus] = useState<ManufacturerOrder['status']>(editOrder?.status || 'confirmed');

  // Items
  const [items, setItems] = useState<OrderItem[]>(editOrder?.items || [EMPTY_ITEM()]);

  // Jersey fields
  const [teamName, setTeamName] = useState(editOrder?.teamName || '');
  const [tournamentName, setTournamentName] = useState(editOrder?.tournamentName || '');
  const [playerNames, setPlayerNames] = useState(editOrder?.playerNames || '');
  const [playerNumbers, setPlayerNumbers] = useState(editOrder?.playerNumbers || '');
  const [sponsor, setSponsor] = useState(editOrder?.sponsor || '');
  const [collarType, setCollarType] = useState(editOrder?.collarType || 'V-Neck');
  const [sleeveType, setSleeveType] = useState(editOrder?.sleeveType || 'Short');
  const [fabric, setFabric] = useState(editOrder?.fabric || 'Polyester');
  const [jerseyType, setJerseyType] = useState(editOrder?.jerseyType || 'Football');
  const [shortsRequired, setShortsRequired] = useState(editOrder?.shortsRequired || false);
  const [sublimation, setSublimation] = useState(editOrder?.sublimation || true);
  const [embroidery, setEmbroidery] = useState(editOrder?.embroidery || false);
  const [printing, setPrinting] = useState(editOrder?.printing || false);
  const [packaging, setPackaging] = useState(editOrder?.packaging || true);
  const [specialInstructions, setSpecialInstructions] = useState(editOrder?.specialInstructions || '');
  const [jerseyOpen, setJerseyOpen] = useState(false);

  // Pricing
  const [printingCharges, setPrintingCharges] = useState(editOrder?.printingCharges || 0);
  const [packagingCharges, setPackagingCharges] = useState(editOrder?.packagingCharges || 0);
  const [additionalCharges, setAdditionalCharges] = useState(editOrder?.additionalCharges || 0);
  const [discount, setDiscount] = useState(editOrder?.discount || 0);
  const [gstPct, setGstPct] = useState(editOrder?.gstPct || 18);
  const [shipping, setShipping] = useState(editOrder?.shipping || 0);
  const [roundOff, setRoundOff] = useState(editOrder?.roundOff || 0);

  // Advance payment
  const [showAdvance, setShowAdvance] = useState(false);
  const [advAmount, setAdvAmount] = useState(0);
  const [advMode, setAdvMode] = useState<PaymentMode>('cash');
  const [advRef, setAdvRef] = useState('');
  const [advDate, setAdvDate] = useState(today());

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derived pricing
  const itemsTotal = useMemo(() => items.reduce((s, item) => s + calcItemAmount(item).amount, 0), [items]);
  const subtotal = itemsTotal + printingCharges + packagingCharges + additionalCharges - discount;
  const gstAmount = subtotal * gstPct / 100;
  const grandTotal = subtotal + gstAmount + shipping + roundOff;

  // Customer lookup
  const selectedCustomer = store.state.customers.find(c => c.id === customerId);
  const filteredCustomers = store.state.customers.filter(c =>
    !custSearch || c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.businessName.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone.includes(custSearch)
  );

  // Update item
  const updateItem = (id: string, updates: Partial<OrderItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };
      const { qty, amount } = calcItemAmount(updated);
      return { ...updated, totalQty: qty, amount };
    }));
  };

  const updateSize = (id: string, size: string, val: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const sizes = { ...item.sizes, [size]: val || 0 };
      const qty = Object.values(sizes).reduce((s, v) => s + v, 0);
      const sub = qty * (item.rate || 0);
      const afterDisc = sub * (1 - (item.discount || 0) / 100);
      const amount = afterDisc * (1 + (item.taxPct || 0) / 100);
      return { ...item, sizes, totalQty: qty, amount };
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerId) e.customer = 'Please select a customer';
    if (items.every(item => item.totalQty === 0)) e.items = 'At least one item with quantity is required';
    if (items.some(item => item.rate <= 0 && item.totalQty > 0)) e.rate = 'All items need a rate > 0';
    if (deliveryDate < orderDate) e.deliveryDate = 'Delivery date must be after order date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = (saveStatus: ManufacturerOrder['status']) => {
    if (!validate()) return;

    const payload = {
      customerId, orderDate, deliveryDate, dueDate, priority, status: saveStatus,
      paymentStatus: 'unpaid' as const, items,
      teamName, tournamentName, playerNames, playerNumbers, sponsor,
      collarType, sleeveType, fabric, jerseyType, shortsRequired, sublimation, embroidery, printing, packaging, specialInstructions, referenceDesign: '',
      itemsTotal, printingCharges, packagingCharges, additionalCharges, discount,
      gstPct, gstAmount, shipping, roundOff, grandTotal,
      totalPaid: 0, outstanding: grandTotal, notes: '',
    };

    if (editOrder) {
      store.dispatch({ type: 'UPDATE_MFG_ORDER', payload: { ...editOrder, ...payload } });
    } else {
      // We need to generate a temp ID to link advance payment
      const tempId = `mfg-new-${Date.now()}`;
      store.dispatch({ type: 'ADD_MFG_ORDER', payload });
      // If advance is set, the order will be the latest one added — add payment after
      if (showAdvance && advAmount > 0) {
        // Get the newly added order from state after dispatch (use a small timeout trick via callback)
        setTimeout(() => {
          const newOrder = store.state.manufacturerOrders[store.state.manufacturerOrders.length - 1];
          if (newOrder) {
            store.dispatch({
              type: 'ADD_PAYMENT',
              payload: {
                customerId, date: advDate, amount: advAmount, mode: advMode,
                referenceNumber: advRef, notes: 'Advance payment', receivedBy: 'Admin',
                allocations: [{ orderId: newOrder.id, orderType: 'manufacturer', amount: advAmount }],
              },
            });
          }
        }, 50);
      }
    }
    onSaved();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] bg-[#FAF8F5] shrink-0">
          <div>
            <h2 className="text-lg font-black text-[#171717]">{editOrder ? `Edit ${editOrder.orderNumber}` : 'New Manufacturing Order'}</h2>
            <p className="text-xs text-[#71717A]">Fill in details and save to create the order</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F0EDE8]"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Section 1 — Customer */}
          <div className="px-6 py-5 border-b border-[#E8E4DE]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717A] mb-3">Customer</h3>
            <div className="relative">
              <div className="flex items-center border border-[#E8E4DE] rounded-xl overflow-hidden focus-within:border-[#E4572E] focus-within:ring-1 focus-within:ring-[#E4572E]/20 bg-white">
                <Search size={15} className="ml-3 text-[#71717A] shrink-0"/>
                <input
                  value={selectedCustomer ? selectedCustomer.businessName : custSearch}
                  onChange={e => { setCustSearch(e.target.value); setCustomerId(''); setCustDropOpen(true); }}
                  onFocus={() => setCustDropOpen(true)}
                  placeholder="Search customer by name or phone..."
                  className="flex-1 px-3 py-2.5 text-sm outline-none"
                />
                {customerId && <button onClick={() => { setCustomerId(''); setCustSearch(''); }} className="mr-2"><X size={14} className="text-[#71717A]"/></button>}
              </div>
              <AnimatePresence>
                {custDropOpen && !customerId && (
                  <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
                    className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E8E4DE] rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <p className="p-4 text-sm text-[#71717A] text-center">No customers found</p>
                    ) : filteredCustomers.map(c => (
                      <button key={c.id} onClick={() => { setCustomerId(c.id); setCustDropOpen(false); setCustSearch(''); }}
                        className="flex items-start justify-between w-full px-4 py-3 hover:bg-[#FAF8F5] text-left border-b border-[#F0EDE8] last:border-0">
                        <div>
                          <p className="text-sm font-semibold text-[#171717]">{c.businessName}</p>
                          <p className="text-xs text-[#71717A]">{c.name} · {c.phone}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {errors.customer && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.customer}</p>}

            {selectedCustomer && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#171717]">{selectedCustomer.businessName}</p>
                  <p className="text-xs text-[#71717A]">{selectedCustomer.phone} {selectedCustomer.gstin && `· GSTIN: ${selectedCustomer.gstin}`}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2 — Order Info */}
          <div className="px-6 py-5 border-b border-[#E8E4DE]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717A] mb-3">Order Information</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Order Date', val: orderDate, set: setOrderDate },
                { label: 'Delivery Date', val: deliveryDate, set: setDeliveryDate },
                { label: 'Due Date', val: dueDate, set: setDueDate },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">{f.label}</label>
                  <input type="date" value={f.val} onChange={e => f.set(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
                  {f.label === 'Delivery Date' && errors.deliveryDate && <p className="text-red-500 text-xs mt-0.5">{errors.deliveryDate}</p>}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-[#52525B] uppercase tracking-wider">Priority:</span>
              {(['normal','urgent','express'] as const).map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all', priority===p ? 'bg-[#E4572E] text-white border-[#E4572E]' : 'bg-white text-[#52525B] border-[#E8E4DE] hover:border-[#E4572E]/50')}>
                  {p.charAt(0).toUpperCase()+p.slice(1)}
                </button>
              ))}
              <span className="text-xs font-semibold text-[#52525B] uppercase tracking-wider ml-4">Status:</span>
              <select value={status} onChange={e => setStatus(e.target.value as ManufacturerOrder['status'])}
                className="px-3 py-1.5 rounded-xl border border-[#E8E4DE] text-xs font-semibold focus:outline-none focus:border-[#E4572E]">
                {[['draft','Draft'],['confirmed','Confirmed'],['production','In Production'],['ready','Ready'],['dispatched','Dispatched'],['completed','Completed'],['cancelled','Cancelled']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Section 3 — Items */}
          <div className="px-6 py-5 border-b border-[#E8E4DE]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717A] mb-3">Items</h3>
            {errors.items && <p className="text-red-500 text-xs mb-2 flex items-center gap-1"><AlertCircle size={12}/>{errors.items}</p>}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border border-[#E8E4DE] rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold">Product</label>
                      <input value={item.product} onChange={e => updateItem(item.id, {product: e.target.value})}
                        className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]" placeholder="e.g. Football Jersey"/>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold">Category</label>
                      <input value={item.category} onChange={e => updateItem(item.id, {category: e.target.value})}
                        className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]" placeholder="Jersey"/>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold">SKU / Design</label>
                      <input value={item.sku} onChange={e => updateItem(item.id, {sku: e.target.value})}
                        className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]" placeholder="J-102"/>
                    </div>
                  </div>

                  {/* Size inputs */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold mb-1 block">Size Breakdown</label>
                    <div className="flex gap-2 flex-wrap">
                      {SIZES.map(size => (
                        <div key={size} className="text-center">
                          <p className="text-[10px] text-[#71717A] font-bold">{size}</p>
                          <input
                            type="number" min="0" value={item.sizes[size] || ''}
                            onChange={e => updateSize(item.id, size, parseInt(e.target.value)||0)}
                            className="w-10 px-1 py-1 rounded-lg border border-[#E8E4DE] text-center text-sm focus:outline-none focus:border-[#E4572E]"
                          />
                        </div>
                      ))}
                      <div className="text-center ml-2">
                        <p className="text-[10px] text-[#E4572E] font-bold">TOTAL</p>
                        <div className="w-10 px-1 py-1 text-center text-sm font-black text-[#E4572E]">{item.totalQty}</div>
                      </div>
                    </div>
                  </div>

                  {/* Rate, discount, tax */}
                  <div className="grid grid-cols-4 gap-3 items-end">
                    {[
                      { label: 'Rate (₹)', val: item.rate, key: 'rate' as const },
                      { label: 'Disc %', val: item.discount, key: 'discount' as const },
                      { label: 'Tax %', val: item.taxPct, key: 'taxPct' as const },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold">{f.label}</label>
                        <input type="number" min="0" value={f.val || ''}
                          onChange={e => updateItem(item.id, {[f.key]: parseFloat(e.target.value)||0})}
                          className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
                      </div>
                    ))}
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold">Amount</p>
                      <p className="text-base font-black text-[#E4572E] mt-1">{fmt(item.amount)}</p>
                    </div>
                  </div>

                  {items.length > 1 && (
                    <div className="flex justify-end">
                      <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700">
                        <Trash2 size={13}/> Remove item
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setItems(prev => [...prev, EMPTY_ITEM()])}
                className="w-full py-3 border-2 border-dashed border-[#E8E4DE] rounded-xl text-sm font-semibold text-[#71717A] hover:border-[#E4572E]/40 hover:text-[#E4572E] transition-all flex items-center justify-center gap-2">
                <Plus size={16}/> Add Item
              </button>
            </div>
          </div>

          {/* Section 4 — Jersey Details (accordion) */}
          <div className="px-6 py-4 border-b border-[#E8E4DE]">
            <button onClick={() => setJerseyOpen(!jerseyOpen)}
              className="flex items-center justify-between w-full text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717A]">Jersey Custom Details</h3>
              {jerseyOpen ? <ChevronUp size={16} className="text-[#71717A]"/> : <ChevronDown size={16} className="text-[#71717A]"/>}
            </button>
            <AnimatePresence>
              {jerseyOpen && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                  <div className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Team Name', val: teamName, set: setTeamName },
                        { label: 'Tournament', val: tournamentName, set: setTournamentName },
                        { label: 'Sponsor', val: sponsor, set: setSponsor },
                        { label: 'Collar Type', val: collarType, set: setCollarType },
                        { label: 'Sleeve Type', val: sleeveType, set: setSleeveType },
                        { label: 'Fabric', val: fabric, set: setFabric },
                        { label: 'Jersey Type', val: jerseyType, set: setJerseyType },
                      ].map(f => (
                        <div key={f.label}>
                          <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">{f.label}</label>
                          <input value={f.val} onChange={e => f.set(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Player Names (one per line)</label>
                      <textarea value={playerNames} onChange={e => setPlayerNames(e.target.value)} rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm resize-none focus:outline-none focus:border-[#E4572E]"/>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Player Numbers</label>
                      <textarea value={playerNumbers} onChange={e => setPlayerNumbers(e.target.value)} rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm resize-none focus:outline-none focus:border-[#E4572E]"/>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { label: 'Shorts Required', val: shortsRequired, set: setShortsRequired },
                        { label: 'Sublimation', val: sublimation, set: setSublimation },
                        { label: 'Embroidery', val: embroidery, set: setEmbroidery },
                        { label: 'Printing', val: printing, set: setPrinting },
                        { label: 'Packaging', val: packaging, set: setPackaging },
                      ].map(f => (
                        <label key={f.label} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={f.val} onChange={e => f.set(e.target.checked)} className="w-4 h-4 accent-[#E4572E]"/>
                          <span className="text-sm text-[#171717]">{f.label}</span>
                        </label>
                      ))}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Special Instructions</label>
                      <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm resize-none focus:outline-none focus:border-[#E4572E]"/>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 5 — Pricing */}
          <div className="px-6 py-5 border-b border-[#E8E4DE]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717A] mb-3">Pricing Summary</h3>
            <div className="max-w-sm ml-auto space-y-2.5">
              {[
                { label: 'Items Total', val: itemsTotal, readOnly: true },
                { label: 'Printing Charges', val: printingCharges, set: setPrintingCharges },
                { label: 'Packaging Charges', val: packagingCharges, set: setPackagingCharges },
                { label: 'Additional Charges', val: additionalCharges, set: setAdditionalCharges },
                { label: 'Discount (₹)', val: discount, set: setDiscount },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between text-sm">
                  <span className="text-[#52525B]">{f.label}</span>
                  {f.readOnly ? (
                    <span className="font-semibold text-[#171717]">{fmt(f.val)}</span>
                  ) : (
                    <input type="number" min="0" value={f.val || ''}
                      onChange={e => f.set!(parseFloat(e.target.value)||0)}
                      className="w-28 px-2 py-1 rounded-lg border border-[#E8E4DE] text-sm text-right focus:outline-none focus:border-[#E4572E]"/>
                  )}
                </div>
              ))}
              <div className="border-t border-[#E8E4DE] pt-2 flex items-center justify-between text-sm">
                <span className="text-[#52525B]">Subtotal</span>
                <span className="font-semibold text-[#171717]">{fmt(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[#52525B]">GST</span>
                  <select value={gstPct} onChange={e => setGstPct(Number(e.target.value))}
                    className="px-1.5 py-0.5 rounded-lg border border-[#E8E4DE] text-xs">
                    {[0,5,12,18,28].map(g => <option key={g} value={g}>{g}%</option>)}
                  </select>
                </div>
                <span className="font-semibold text-[#171717]">{fmt(gstAmount)}</span>
              </div>
              {[
                { label: 'Shipping', val: shipping, set: setShipping },
                { label: 'Round Off', val: roundOff, set: setRoundOff },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between text-sm">
                  <span className="text-[#52525B]">{f.label}</span>
                  <input type="number" value={f.val || ''}
                    onChange={e => f.set(parseFloat(e.target.value)||0)}
                    className="w-28 px-2 py-1 rounded-lg border border-[#E8E4DE] text-sm text-right focus:outline-none focus:border-[#E4572E]"/>
                </div>
              ))}
              <div className="border-t-2 border-[#E4572E]/30 pt-2 flex items-center justify-between">
                <span className="font-black text-[#171717]">Grand Total</span>
                <span className="text-2xl font-black text-[#E4572E]">{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Section 6 — Advance Payment */}
          <div className="px-6 py-5 border-b border-[#E8E4DE]">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setShowAdvance(!showAdvance)}
                className={cn('relative w-11 h-6 rounded-full transition-all', showAdvance ? 'bg-[#E4572E]' : 'bg-[#D8D5CF]')}>
                <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', showAdvance ? 'left-5.5' : 'left-0.5')} style={{left: showAdvance ? '22px' : '2px'}}/>
              </button>
              <span className="text-sm font-semibold text-[#171717]">Add Advance Payment</span>
            </div>
            <AnimatePresence>
              {showAdvance && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                  <div className="pt-2 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Amount (₹)</label>
                        <input type="number" value={advAmount||''} onChange={e => setAdvAmount(parseFloat(e.target.value)||0)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Date</label>
                        <input type="date" value={advDate} onChange={e => setAdvDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"/>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Payment Mode</label>
                      <div className="flex gap-2 flex-wrap">
                        {PAYMENT_MODES.map(m => (
                          <button key={m} onClick={() => setAdvMode(m)}
                            className={cn('px-3 py-1.5 rounded-full text-xs font-bold border transition-all', advMode===m ? 'bg-[#E4572E] text-white border-[#E4572E]' : 'bg-white text-[#52525B] border-[#E8E4DE] hover:border-[#E4572E]/50')}>
                            {PAYMENT_MODE_LABELS[m]}
                          </button>
                        ))}
                      </div>
                    </div>
                    {['upi','bank','cheque'].includes(advMode) && (
                      <div>
                        <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Reference Number</label>
                        <input value={advRef} onChange={e => setAdvRef(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]" placeholder="UPI Ref / NEFT Ref..."/>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3 p-3 bg-[#FAF8F5] rounded-xl">
                      <div className="text-center"><p className="text-[10px] text-[#71717A] uppercase">Grand Total</p><p className="font-black text-sm">{fmt(grandTotal)}</p></div>
                      <div className="text-center"><p className="text-[10px] text-emerald-600 uppercase">Advance</p><p className="font-black text-sm text-emerald-600">{fmt(advAmount)}</p></div>
                      <div className="text-center"><p className="text-[10px] text-amber-600 uppercase">Remaining</p><p className="font-black text-sm text-amber-700">{fmt(Math.max(0, grandTotal - advAmount))}</p></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="px-6 py-4 border-t border-[#E8E4DE] bg-[#FAF8F5] shrink-0 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#52525B] hover:bg-white">Cancel</button>
          <div className="flex gap-3">
            <button onClick={() => handleSave('draft')} className="px-4 py-2.5 rounded-xl border border-[#E8E4DE] text-sm font-bold text-[#171717] hover:bg-white">Save as Draft</button>
            <button onClick={() => handleSave('confirmed')} className="px-5 py-2.5 rounded-xl bg-[#E4572E] text-white text-sm font-bold hover:bg-[#D4431B] shadow-sm">
              {editOrder ? 'Update Order' : 'Save & Confirm'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
