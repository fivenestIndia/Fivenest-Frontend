import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Plus, Trash2, AlertCircle, Settings, ShoppingBag,
  Package, Tag, Edit3, Sparkles, Check
} from 'lucide-react';
import {
  useOrderStore, PrintingService, PrintingOrder, PrintingGood,
  PrintingOrderLineItem, PriceSlab,
  PAYMENT_MODES, PAYMENT_MODE_LABELS, PaymentMode, STATUS_COLORS, STATUS_LABELS,
  fmt, getEffectivePrintingRate
} from '../../hooks/useOrderStore';
import TransactionTable, { Column } from './TransactionTable';
import PrintingJobSheetModal from './PrintingJobSheetModal';

const cn = (...c: (string | undefined | boolean)[]) => c.filter(Boolean).join(' ');
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d: string, n: number) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};
const lineUid = () => `li-${Math.random().toString(36).slice(2, 9)}`;

const GOOD_UNITS = ['pc', 'set', 'pair', 'meter', 'sq.ft', 'job'];
const GOOD_CATEGORIES = ['Sublimation', 'DTF', 'Embroidery', 'Screen Print', 'Vinyl', 'Custom'];

interface Props {
  store: ReturnType<typeof useOrderStore>;
  onReceivePayment: (customerId: string) => void;
  onViewCustomerLedger?: (customerId: string) => void;
}

// ── Add/Edit Custom Printing Good Drawer ──────────────────────────────────────
function GoodDrawer({
  store,
  good,
  onClose,
}: {
  store: ReturnType<typeof useOrderStore>;
  good?: PrintingGood;
  onClose: () => void;
}) {
  const [name, setName] = useState(good?.name || '');
  const [price, setPrice] = useState<number>(good?.price ?? 0);
  const [unit, setUnit] = useState(good?.unit || 'pc');
  const [category, setCategory] = useState(good?.category || 'Sublimation');
  const [description, setDescription] = useState(good?.description || '');
  const [active, setActive] = useState(good?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Good name is required (e.g. Front Print)';
    if (price < 0 || isNaN(price)) e.price = 'Enter valid price';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload = {
      name: name.trim(),
      price: Number(price) || 0,
      unit,
      category,
      description: description.trim(),
      active,
    };
    if (good) {
      store.dispatch({ type: 'UPDATE_PRINTING_GOOD', payload: { ...good, ...payload } });
    } else {
      store.dispatch({ type: 'ADD_PRINTING_GOOD', payload });
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] shrink-0">
          <div>
            <h2 className="text-lg font-black text-[#171717]">
              {good ? 'Edit Good Item' : 'Add Custom Good'}
            </h2>
            <p className="text-xs text-[#71717A]">e.g. Front = ₹30, Back = ₹30, Front & Back = ₹60</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F5F3EF]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">
              Good / Print Part Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Front Print, Back Print, Front & Back"
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">
                Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={price || ''}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="30"
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm font-bold focus:outline-none focus:border-[#E4572E]"
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">
                Billing Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm bg-white focus:outline-none focus:border-[#E4572E]"
              >
                {GOOD_UNITS.map((u) => (
                  <option key={u} value={u}>
                    Per {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GOOD_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-xs font-bold transition-all',
                    category === cat
                      ? 'bg-[#E4572E] text-white border-[#E4572E]'
                      : 'bg-white text-[#52525B] border-[#E8E4DE] hover:border-[#E4572E]/50'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#52525B] mb-1.5 block">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Full sublimation front chest print"
              className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={cn('relative w-11 h-6 rounded-full transition-all', active ? 'bg-[#E4572E]' : 'bg-[#D8D5CF]')}
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                style={{ left: active ? '22px' : '2px' }}
              />
            </button>
            <span className="text-sm font-semibold text-[#171717]">
              {active ? 'Active in Bill Picker' : 'Hidden / Inactive'}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E8E4DE] shrink-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#52525B] hover:bg-[#F5F3EF]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#E4572E] text-white text-sm font-bold hover:bg-[#D4431B]"
          >
            {good ? 'Update Good' : 'Save Good'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Add/Edit Service Drawer ────────────────────────────────────────────────────
function ServiceDrawer({
  store,
  svc,
  onClose,
}: {
  store: ReturnType<typeof useOrderStore>;
  svc?: PrintingService;
  onClose: () => void;
}) {
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
    const payload = {
      name,
      pricingMethod,
      baseRate,
      slabs,
      minQuantity: minQty,
      minCharge,
      rushCharge,
      setupCharge,
      gstPct,
      active,
      customerRates: svc?.customerRates || [],
    };
    if (svc) store.dispatch({ type: 'UPDATE_PRINTING_SERVICE', payload: { ...svc, ...payload } });
    else store.dispatch({ type: 'ADD_PRINTING_SERVICE', payload });
    onClose();
  };

  const updateSlab = (i: number, updates: Partial<PriceSlab>) => {
    setSlabs((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...updates } : s)));
  };

  const PRICING_LABELS: Record<PrintingService['pricingMethod'], string> = {
    per_piece: 'Per Piece',
    per_meter: 'Per Meter',
    per_sqft: 'Per Sq.Ft',
    per_sqinch: 'Per Sq.Inch',
    per_design: 'Per Design',
    per_job: 'Per Job',
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: 440 }}
        animate={{ x: 0 }}
        exit={{ x: 440 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[440px] bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] shrink-0">
          <h2 className="text-lg font-black text-[#171717]">{svc ? 'Edit Service' : 'Add Printing Type'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F5F3EF]">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Service Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sublimation Printing"
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
            />
            {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">Pricing Method</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PRICING_LABELS) as Array<PrintingService['pricingMethod']>).map((m) => (
                <button
                  key={m}
                  onClick={() => setPricingMethod(m)}
                  className={cn(
                    'px-2 py-2 rounded-xl border text-xs font-bold transition-all',
                    pricingMethod === m
                      ? 'bg-[#E4572E] text-white border-[#E4572E]'
                      : 'bg-white text-[#52525B] border-[#E8E4DE] hover:border-[#E4572E]/50'
                  )}
                >
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
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">{f.label}</label>
                <input
                  type="number"
                  min="0"
                  value={f.val || ''}
                  onChange={(e) => f.set(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
                />
                {f.err && <p className="text-red-500 text-xs mt-0.5">{f.err}</p>}
              </div>
            ))}
          </div>

          {/* Quantity slabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#52525B]">Quantity Slabs</label>
              <button
                onClick={() => setSlabs((prev) => [...prev, { minQty: (prev[prev.length - 1]?.maxQty || 0) + 1, maxQty: null, rate: 0 }])}
                className="text-xs text-[#E4572E] font-bold flex items-center gap-1"
              >
                <Plus size={12} />
                Add Slab
              </button>
            </div>
            <div className="space-y-2">
              {slabs.map((slab, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="number"
                    value={slab.minQty}
                    onChange={(e) => updateSlab(i, { minQty: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E]"
                    placeholder="Min"
                  />
                  <span className="text-xs text-[#71717A]">–</span>
                  <input
                    type="number"
                    value={slab.maxQty ?? ''}
                    onChange={(e) => updateSlab(i, { maxQty: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-20 px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E]"
                    placeholder="Max"
                  />
                  <span className="text-xs text-[#71717A]">@₹</span>
                  <input
                    type="number"
                    value={slab.rate}
                    onChange={(e) => updateSlab(i, { rate: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E]"
                    placeholder="Rate"
                  />
                  {slabs.length > 1 && (
                    <button onClick={() => setSlabs((prev) => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActive(!active)}
              className={cn('relative w-11 h-6 rounded-full transition-all', active ? 'bg-[#E4572E]' : 'bg-[#D8D5CF]')}
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                style={{ left: active ? '22px' : '2px' }}
              />
            </button>
            <span className="text-sm font-semibold text-[#171717]">{active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#E8E4DE] shrink-0 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#52525B] hover:bg-[#F5F3EF]">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">
            Save
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── New / Edit Printing Order Drawer (with Multi-Good Line Items & Inline Quick Add) ──
function PrintingOrderDrawer({
  store,
  editOrder,
  initialGood,
  onClose,
  onSaved,
}: {
  store: ReturnType<typeof useOrderStore>;
  editOrder?: PrintingOrder;
  initialGood?: PrintingGood;
  onClose: () => void;
  onSaved: () => void;
}) {
  const defaultSvcId = editOrder?.serviceId || store.state.printingServices.find((s) => s.active)?.id || '';

  const [customerId, setCustomerId] = useState(editOrder?.customerId || '');
  const [custSearch, setCustSearch] = useState('');
  const [custDropOpen, setCustDropOpen] = useState(false);
  const [serviceId, setServiceId] = useState(defaultSvcId);

  // Goods line items (default if initialGood passed or editing an order with lineItems)
  const [lineItems, setLineItems] = useState<PrintingOrderLineItem[]>(() => {
    if (editOrder?.lineItems && editOrder.lineItems.length > 0) {
      return editOrder.lineItems;
    }
    if (initialGood) {
      return [
        {
          id: lineUid(),
          goodId: initialGood.id,
          name: initialGood.name,
          unit: initialGood.unit || 'pc',
          rate: initialGood.price,
          qty: 1,
          amount: initialGood.price,
        },
      ];
    }
    return [];
  });

  // Legacy single quantity fallback when no line items are added
  const [manualQuantity, setManualQuantity] = useState(editOrder && (!editOrder.lineItems || editOrder.lineItems.length === 0) ? editOrder.quantity : 0);

  // Inline Goods picker filter & inline quick-create good
  const [goodSearch, setGoodSearch] = useState('');
  const [showQuickGoodForm, setShowQuickGoodForm] = useState(false);
  const [quickGoodName, setQuickGoodName] = useState('');
  const [quickGoodPrice, setQuickGoodPrice] = useState<string>('');
  const [quickGoodUnit, setQuickGoodUnit] = useState('pc');

  // Job specifications
  const [showSpecs, setShowSpecs] = useState(Boolean(editOrder?.fabric || editOrder?.color || editOrder?.printArea || editOrder?.artworkFile));
  const [material, setMaterial] = useState(editOrder?.material || 'Polyester');
  const [fabric, setFabric] = useState(editOrder?.fabric || '');
  const [color, setColor] = useState(editOrder?.color || '');
  const [printArea, setPrintArea] = useState(editOrder?.printArea || '');
  const [artworkFile, setArtworkFile] = useState(editOrder?.artworkFile || '');
  const [artworkApproved, setArtworkApproved] = useState(editOrder?.artworkApproved ?? false);
  const [specialInstructions, setSpecialInstructions] = useState(editOrder?.specialInstructions || '');

  // Dates, Status & Financials
  const [date, setDate] = useState(editOrder?.date || today());
  const [requiredDate, setRequiredDate] = useState(editOrder?.requiredDate || addDays(today(), 7));
  const [status, setStatus] = useState<PrintingOrder['status']>(editOrder?.status || 'received');
  const [additionalCharges, setAdditionalCharges] = useState(editOrder?.additionalCharges || 0);
  const [discount, setDiscount] = useState(editOrder?.discount || 0);
  const [gstPct, setGstPct] = useState(editOrder?.gstPct ?? 12);

  // Advance payment (for new orders)
  const [showAdvance, setShowAdvance] = useState(false);
  const [advAmount, setAdvAmount] = useState(0);
  const [advMode, setAdvMode] = useState<PaymentMode>('cash');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCustomer = store.state.customers.find((c) => c.id === customerId);
  const selectedService = store.state.printingServices.find((s) => s.id === serviceId);
  const filteredCustomers = store.state.customers.filter(
    (c) =>
      !custSearch ||
      c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
      c.businessName.toLowerCase().includes(custSearch.toLowerCase()) ||
      c.phone.includes(custSearch)
  );

  const activeGoods = (store.state.printingGoods || []).filter((g) => g.active);
  const filteredGoods = activeGoods.filter(
    (g) =>
      !goodSearch.trim() ||
      g.name.toLowerCase().includes(goodSearch.toLowerCase()) ||
      (g.category || '').toLowerCase().includes(goodSearch.toLowerCase())
  );

  const usingGoodsMode = lineItems.length > 0;
  const totalQuantity = usingGoodsMode
    ? lineItems.reduce((acc, l) => acc + (Number(l.qty) || 0), 0)
    : manualQuantity;

  const appliedRate = useMemo(() => {
    if (usingGoodsMode) {
      const sub = lineItems.reduce((acc, l) => acc + (Number(l.rate) || 0) * (Number(l.qty) || 0), 0);
      return totalQuantity > 0 ? Number((sub / totalQuantity).toFixed(2)) : 0;
    }
    if (!selectedService) return 0;
    return getEffectivePrintingRate(selectedService, customerId, manualQuantity);
  }, [usingGoodsMode, lineItems, totalQuantity, selectedService, customerId, manualQuantity]);

  const subtotal = usingGoodsMode
    ? lineItems.reduce((acc, l) => acc + (Number(l.rate) || 0) * (Number(l.qty) || 0), 0)
    : appliedRate * manualQuantity;

  const taxableBase = Math.max(0, subtotal + additionalCharges - discount);
  const gstAmount = Number(((taxableBase * gstPct) / 100).toFixed(2));
  const grandTotal = Number((taxableBase + gstAmount).toFixed(2));

  const handleAddGoodToBill = (g: PrintingGood) => {
    setLineItems((prev) => {
      const existing = prev.find((item) => item.goodId === g.id);
      if (existing) {
        return prev.map((item) =>
          item.goodId === g.id
            ? { ...item, qty: (item.qty || 0) + 1, amount: ((item.qty || 0) + 1) * item.rate }
            : item
        );
      }
      return [
        ...prev,
        {
          id: lineUid(),
          goodId: g.id,
          name: g.name,
          unit: g.unit || 'pc',
          rate: g.price,
          qty: 1,
          amount: g.price,
        },
      ];
    });
  };

  const handleAddBlankLine = () => {
    setLineItems((prev) => [
      ...prev,
      { id: lineUid(), name: '', unit: 'pc', rate: 0, qty: 1, amount: 0 },
    ]);
  };

  const handleQuickCreateGood = () => {
    const cleanName = quickGoodName.trim();
    const parsedPrice = parseFloat(quickGoodPrice) || 0;
    if (!cleanName) return;
    const newId = `good-${Math.random().toString(36).slice(2, 10)}`;
    const newGood: PrintingGood = {
      id: newId,
      name: cleanName,
      price: parsedPrice,
      unit: quickGoodUnit,
      category: selectedService?.name?.includes('DTF') ? 'DTF' : 'Sublimation',
      active: true,
    };
    store.dispatch({
      type: 'ADD_PRINTING_GOOD',
      payload: {
        name: newGood.name,
        price: newGood.price,
        unit: newGood.unit,
        category: newGood.category,
        active: true,
      },
    });
    setLineItems((prev) => [
      ...prev,
      {
        id: lineUid(),
        name: newGood.name,
        unit: newGood.unit,
        rate: newGood.price,
        qty: 1,
        amount: newGood.price,
      },
    ]);
    setQuickGoodName('');
    setQuickGoodPrice('');
    setShowQuickGoodForm(false);
  };

  const updateLineItem = (id: string, fields: Partial<PrintingOrderLineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...fields };
        next.amount = (Number(next.qty) || 0) * (Number(next.rate) || 0);
        return next;
      })
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerId) e.customer = 'Select a customer';
    if (usingGoodsMode) {
      const validLines = lineItems.filter((l) => l.name.trim() && l.qty > 0);
      if (validLines.length === 0) e.quantity = 'Add at least 1 good with quantity > 0';
    } else {
      if (!serviceId) e.service = 'Select a printing service or pick goods above';
      if (!manualQuantity || manualQuantity <= 0) e.quantity = 'Quantity must be > 0 (or tap goods above)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const cleanLineItems = usingGoodsMode
      ? lineItems
          .filter((l) => l.name.trim() && l.qty > 0)
          .map((l) => ({ ...l, amount: (Number(l.qty) || 0) * (Number(l.rate) || 0) }))
      : undefined;

    if (editOrder) {
      store.dispatch({
        type: 'UPDATE_PRINTING_ORDER',
        payload: {
          ...editOrder,
          customerId,
          serviceId,
          date,
          requiredDate,
          status,
          quantity: totalQuantity,
          appliedRate,
          lineItems: cleanLineItems,
          material,
          fabric,
          color,
          printArea,
          artworkFile,
          artworkApproved,
          specialInstructions,
          subtotal,
          additionalCharges,
          discount,
          gstPct,
          gstAmount,
          grandTotal,
        },
      });
    } else {
      store.dispatch({
        type: 'ADD_PRINTING_ORDER',
        payload: {
          customerId,
          serviceId,
          date,
          requiredDate,
          deliveryDate: '',
          status,
          paymentStatus: 'unpaid',
          quantity: totalQuantity,
          appliedRate,
          lineItems: cleanLineItems,
          material,
          fabric,
          color,
          printArea,
          artworkFile,
          artworkApproved,
          specialInstructions,
          subtotal,
          additionalCharges,
          discount,
          gstPct,
          gstAmount,
          grandTotal,
          totalPaid: 0,
          outstanding: grandTotal,
          notes: '',
        },
      });

      if (showAdvance && advAmount > 0) {
        setTimeout(() => {
          const newOrder = store.state.printingOrders[store.state.printingOrders.length - 1];
          if (newOrder) {
            store.dispatch({
              type: 'ADD_PAYMENT',
              payload: {
                customerId,
                date,
                amount: advAmount,
                mode: advMode,
                referenceNumber: '',
                notes: 'Advance',
                receivedBy: 'Admin',
                allocations: [{ orderId: newOrder.id, orderType: 'printing', amount: advAmount }],
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
      <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: 600 }}
        animate={{ x: 0 }}
        exit={{ x: 600 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[600px] bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] shrink-0 bg-[#FAF8F5]">
          <div>
            <h2 className="text-lg font-black text-[#171717]">
              {editOrder ? `Edit Bill ${editOrder.orderNumber}` : 'Create Printing Bill / Order'}
            </h2>
            <p className="text-xs text-[#71717A]">
              Tap saved Goods below to add items &amp; enter quantities instantly
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#EFECE6]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Customer + Printing Service Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">
                Customer / Party *
              </label>
              <div className="relative">
                <div className="flex items-center border border-[#E8E4DE] rounded-xl overflow-hidden focus-within:border-[#E4572E] bg-white">
                  <Search size={14} className="ml-3 text-[#71717A] shrink-0" />
                  <input
                    value={selectedCustomer ? selectedCustomer.businessName : custSearch}
                    onChange={(e) => {
                      setCustSearch(e.target.value);
                      setCustomerId('');
                      setCustDropOpen(true);
                    }}
                    onFocus={() => setCustDropOpen(true)}
                    placeholder="Search customer..."
                    className="flex-1 px-2.5 py-2.5 text-sm outline-none"
                  />
                  {customerId && (
                    <button
                      onClick={() => {
                        setCustomerId('');
                        setCustSearch('');
                      }}
                      className="mr-2"
                    >
                      <X size={13} className="text-[#71717A]" />
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {custDropOpen && !customerId && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E8E4DE] rounded-xl shadow-xl z-20 max-h-44 overflow-y-auto"
                    >
                      {filteredCustomers.length === 0 ? (
                        <div className="p-3 text-xs text-[#71717A] text-center">No matching customers</div>
                      ) : (
                        filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setCustomerId(c.id);
                              setCustDropOpen(false);
                              setCustSearch('');
                            }}
                            className="flex w-full px-3.5 py-2.5 hover:bg-[#FAF8F5] text-left border-b border-[#F0EDE8] last:border-0"
                          >
                            <div>
                              <p className="text-sm font-semibold">{c.businessName}</p>
                              <p className="text-xs text-[#71717A]">
                                {c.name} · {c.phone}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {errors.customer && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.customer}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">
                Department / Print Process
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm bg-white focus:outline-none focus:border-[#E4572E]"
              >
                <option value="">Select printing process...</option>
                {store.state.printingServices
                  .filter((s) => s.active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
            </div>
          </div>

          {/* ── QUICK-ACCESS GOODS CATALOG PICKER ── */}
          <div className="border border-[#E8E4DE] rounded-2xl bg-[#FAF8F5] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-[#E4572E]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#171717]">
                  Quick Add Goods (Tap to Add to Bill)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={goodSearch}
                  onChange={(e) => setGoodSearch(e.target.value)}
                  placeholder="Filter goods..."
                  className="w-32 px-2.5 py-1 rounded-lg border border-[#E8E4DE] bg-white text-xs focus:outline-none focus:border-[#E4572E]"
                />
                <button
                  type="button"
                  onClick={() => setShowQuickGoodForm(!showQuickGoodForm)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF0EB] border border-[#F5C4B2] text-[#E4572E] text-xs font-bold hover:bg-[#FFE4DB]"
                >
                  <Plus size={12} />
                  <span>New Good</span>
                </button>
              </div>
            </div>

            {/* Inline Quick-Create Good Mini-Form */}
            <AnimatePresence>
              {showQuickGoodForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-[#F5C4B2] rounded-xl p-3 grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <label className="text-[10px] font-bold uppercase text-[#52525B] block mb-1">
                        Good Name
                      </label>
                      <input
                        value={quickGoodName}
                        onChange={(e) => setQuickGoodName(e.target.value)}
                        placeholder="e.g. Back Print"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E]"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] font-bold uppercase text-[#52525B] block mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={quickGoodPrice}
                        onChange={(e) => setQuickGoodPrice(e.target.value)}
                        placeholder="30"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E4DE] text-xs font-bold focus:outline-none focus:border-[#E4572E]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase text-[#52525B] block mb-1">
                        Unit
                      </label>
                      <select
                        value={quickGoodUnit}
                        onChange={(e) => setQuickGoodUnit(e.target.value)}
                        className="w-full px-1.5 py-1.5 rounded-lg border border-[#E8E4DE] text-xs bg-white"
                      >
                        {GOOD_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <button
                        type="button"
                        onClick={handleQuickCreateGood}
                        className="w-full py-1.5 rounded-lg bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tap Goods Chips */}
            {filteredGoods.length === 0 ? (
              <p className="text-xs text-[#71717A] py-2 text-center">
                No goods found. Click <strong>+ New Good</strong> above to add items like Front (₹30) or Back (₹30).
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredGoods.map((g) => {
                  const inBill = lineItems.find((l) => l.goodId === g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleAddGoodToBill(g)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all',
                        inBill
                          ? 'bg-[#FFF5F2] border-[#E4572E] text-[#E4572E] shadow-2xs'
                          : 'bg-white border-[#E8E4DE] text-[#171717] hover:border-[#E4572E]/60 hover:bg-white'
                      )}
                    >
                      {inBill ? <Check size={12} className="text-[#E4572E]" /> : <Plus size={12} className="text-[#71717A]" />}
                      <span>{g.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E8E4DE] font-mono text-[11px] font-black text-[#171717]">
                        ₹{g.price}
                      </span>
                      {inBill && (
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[#E4572E] text-white text-[10px]">
                          ×{inBill.qty}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── BILL LINE ITEMS TABLE (OR LEGACY SINGLE-QTY FALLBACK) ── */}
          {usingGoodsMode ? (
            <div className="border border-[#E8E4DE] rounded-2xl overflow-hidden bg-white">
              <div className="bg-[#171717] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
                <span>BILL ITEMS ({lineItems.length})</span>
                <button
                  type="button"
                  onClick={handleAddBlankLine}
                  className="text-[11px] px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white flex items-center gap-1"
                >
                  <Plus size={11} />
                  Custom Line
                </button>
              </div>
              <div className="divide-y divide-[#F0EDE8]">
                {lineItems.map((item, idx) => (
                  <div key={item.id} className="p-3 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <label className="text-[9px] font-bold uppercase text-[#71717A] block mb-0.5">
                        Item #{idx + 1}
                      </label>
                      <input
                        value={item.name}
                        onChange={(e) => updateLineItem(item.id, { name: e.target.value })}
                        placeholder="Item name"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E4DE] text-xs font-semibold focus:outline-none focus:border-[#E4572E]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold uppercase text-[#71717A] block mb-0.5">
                        Qty ({item.unit || 'pc'})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.qty || ''}
                        onChange={(e) => updateLineItem(item.id, { qty: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-xs font-bold text-center focus:outline-none focus:border-[#E4572E]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold uppercase text-[#71717A] block mb-0.5">
                        Rate (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.rate || ''}
                        onChange={(e) => updateLineItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 rounded-lg border border-[#E8E4DE] text-xs font-bold text-right focus:outline-none focus:border-[#E4572E]"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <label className="text-[9px] font-bold uppercase text-[#71717A] block mb-0.5">
                        Amount
                      </label>
                      <span className="text-xs font-black font-mono text-[#E4572E]">
                        {fmt((Number(item.qty) || 0) * (Number(item.rate) || 0))}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end pt-3">
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Remove line"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {errors.quantity && <p className="text-red-500 text-xs px-3 pb-2">{errors.quantity}</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">
                  Quantity (or tap Goods above) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualQuantity || ''}
                  onChange={(e) => setManualQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1.5 block">
                  Applied Service Rate (₹)
                </label>
                <div className="px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#FAF8F5] text-sm font-bold text-[#E4572E]">
                  {appliedRate > 0 ? `₹${appliedRate} / piece` : '—'}
                </div>
                {selectedService && manualQuantity > 0 && (
                  <p className="text-[10px] text-[#71717A] mt-0.5">Auto from service slab pricing</p>
                )}
              </div>
            </div>
          )}

          {/* Optional Print Technical Specs Accordion */}
          <div className="border border-[#E8E4DE] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSpecs(!showSpecs)}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] flex items-center justify-between text-xs font-bold text-[#52525B] hover:text-[#171717]"
            >
              <span>🧵 Job Specifications (Fabric, Color, Print Area, Artwork)</span>
              <span>{showSpecs ? 'Hide ▴' : 'Add Specs ▾'}</span>
            </button>
            {showSpecs && (
              <div className="p-4 grid grid-cols-2 gap-3 bg-white border-t border-[#E8E4DE]">
                {[
                  { label: 'Material', val: material, set: setMaterial },
                  { label: 'Fabric', val: fabric, set: setFabric },
                  { label: 'Color', val: color, set: setColor },
                  { label: 'Print Area', val: printArea, set: setPrintArea },
                  { label: 'Artwork File', val: artworkFile, set: setArtworkFile },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider mb-1 block">
                      {f.label}
                    </label>
                    <input
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E]"
                    />
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    checked={artworkApproved}
                    onChange={(e) => setArtworkApproved(e.target.checked)}
                    className="w-4 h-4 accent-[#E4572E]"
                  />
                  <span className="text-xs font-semibold text-[#171717]">Artwork Approved</span>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider mb-1 block">
                    Special Instructions
                  </label>
                  <input
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Optional printing notes..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider mb-1 block">Order Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider mb-1 block">Due Date</label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-[#E8E4DE] text-xs focus:outline-none focus:border-[#E4572E]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-wider mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PrintingOrder['status'])}
                className="w-full px-2.5 py-2 rounded-xl border border-[#E8E4DE] text-xs bg-white focus:outline-none focus:border-[#E4572E]"
              >
                {[
                  ['received', 'Received'],
                  ['quotation', 'Quotation'],
                  ['artwork_pending', 'Artwork Pending'],
                  ['printing', 'Printing'],
                  ['quality_check', 'Quality Check'],
                  ['ready', 'Ready'],
                  ['delivered', 'Delivered'],
                  ['cancelled', 'Cancelled'],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">Bill Summary</h4>
            <div className="flex justify-between text-sm">
              <span className="text-[#52525B]">
                Subtotal ({totalQuantity} pcs{usingGoodsMode ? ` · ${lineItems.length} items` : ` × ₹${appliedRate}`})
              </span>
              <span className="font-bold font-mono">{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#52525B]">Additional / Setup Charges</span>
              <input
                type="number"
                min="0"
                value={additionalCharges || ''}
                onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 rounded-lg border border-[#E8E4DE] text-sm text-right bg-white focus:outline-none focus:border-[#E4572E]"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#52525B]">Discount (₹)</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 rounded-lg border border-[#E8E4DE] text-sm text-right bg-white focus:outline-none focus:border-[#E4572E]"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-[#52525B]">
                GST
                <select
                  value={gstPct}
                  onChange={(e) => setGstPct(Number(e.target.value))}
                  className="px-1.5 py-0.5 rounded-lg border border-[#E8E4DE] text-xs bg-white font-bold"
                >
                  {[0, 5, 12, 18].map((g) => (
                    <option key={g} value={g}>
                      {g === 0 ? '0% (No GST)' : `${g}%`}
                    </option>
                  ))}
                </select>
              </span>
              <span className="font-semibold font-mono">{fmt(gstAmount)}</span>
            </div>
            <div className="border-t border-[#E8E4DE] pt-2 flex justify-between items-center">
              <span className="font-black text-[#171717]">Grand Total</span>
              <span className="text-xl font-black text-[#E4572E] font-mono">{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Advance Payment (new order only) */}
          {!editOrder && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setShowAdvance(!showAdvance)}
                  className={cn('relative w-11 h-6 rounded-full transition-all', showAdvance ? 'bg-[#E4572E]' : 'bg-[#D8D5CF]')}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                    style={{ left: showAdvance ? '22px' : '2px' }}
                  />
                </button>
                <span className="text-sm font-semibold text-[#171717]">Add Advance Payment?</span>
              </div>
              <AnimatePresence>
                {showAdvance && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Amount (₹)</label>
                        <input
                          type="number"
                          value={advAmount || ''}
                          onChange={(e) => setAdvAmount(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm focus:outline-none focus:border-[#E4572E]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-1 block">Mode</label>
                        <select
                          value={advMode}
                          onChange={(e) => setAdvMode(e.target.value as PaymentMode)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm bg-white focus:outline-none focus:border-[#E4572E]"
                        >
                          {PAYMENT_MODES.map((m) => (
                            <option key={m} value={m}>
                              {PAYMENT_MODE_LABELS[m]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E8E4DE] shrink-0 flex justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#52525B] hover:bg-[#F5F3EF]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm"
          >
            {editOrder ? 'Update Order & Invoice' : 'Save Printing Bill'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Printing Module ───────────────────────────────────────────────────────
export default function PrintingModule({ store, onReceivePayment, onViewCustomerLedger }: Props) {
  const [tab, setTab] = useState<'orders' | 'goods' | 'rates'>('orders');
  const [showServiceDrawer, setShowServiceDrawer] = useState(false);
  const [editService, setEditService] = useState<PrintingService | undefined>();
  const [showGoodDrawer, setShowGoodDrawer] = useState(false);
  const [editGood, setEditGood] = useState<PrintingGood | undefined>();
  const [goodCategoryFilter, setGoodCategoryFilter] = useState<string>('All');
  const [goodCatalogSearch, setGoodCatalogSearch] = useState<string>('');
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PrintingOrder | undefined>();
  const [initialOrderGood, setInitialOrderGood] = useState<PrintingGood | undefined>();
  const [viewingOrder, setViewingOrder] = useState<PrintingOrder | null>(null);

  const goodsList = store.state.printingGoods || [];
  const filteredCatalogGoods = useMemo(() => {
    return goodsList.filter((g) => {
      const catOk = goodCategoryFilter === 'All' || (g.category || 'Custom') === goodCategoryFilter;
      const qOk =
        !goodCatalogSearch.trim() ||
        g.name.toLowerCase().includes(goodCatalogSearch.toLowerCase()) ||
        (g.description || '').toLowerCase().includes(goodCatalogSearch.toLowerCase());
      return catOk && qOk;
    });
  }, [goodsList, goodCategoryFilter, goodCatalogSearch]);

  const orderColumns: Column<PrintingOrder>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setViewingOrder(row)}
          className="font-mono text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-left"
          title="Click to view Tax Invoice"
        >
          {row.orderNumber}
        </button>
      ),
    },
    {
      key: 'customerId',
      label: 'Customer',
      render: (row) => {
        const c = store.state.customers.find((x) => x.id === row.customerId);
        return (
          <div>
            {onViewCustomerLedger ? (
              <button
                type="button"
                onClick={() => onViewCustomerLedger(row.customerId)}
                className="font-bold text-sm text-[#171717] hover:text-[#E4572E] hover:underline text-left block"
                title="Click to view Customer Ledger"
              >
                {c?.businessName || '—'}
              </button>
            ) : (
              <span className="font-bold text-sm text-[#171717]">{c?.businessName || '—'}</span>
            )}
            {c?.name && <p className="text-xs text-[#71717A]">{c.name}</p>}
          </div>
        );
      },
    },
    {
      key: 'serviceId',
      label: 'Printing / Goods',
      render: (row) => {
        const s = store.state.printingServices.find((x) => x.id === row.serviceId);
        if (row.lineItems && row.lineItems.length > 0) {
          const preview = row.lineItems.slice(0, 2).map((l) => `${l.name} (${l.qty})`).join(', ');
          const extra = row.lineItems.length > 2 ? ` +${row.lineItems.length - 2}` : '';
          return (
            <div>
              <span className="font-semibold text-xs text-[#171717] block">{preview}{extra}</span>
              <span className="text-[10px] text-[#71717A]">{s?.name || 'Custom Goods Bill'}</span>
            </div>
          );
        }
        return <span>{s?.name || '—'}</span>;
      },
    },
    { key: 'quantity', label: 'Qty', sortable: true, render: (row) => <span>{row.quantity.toLocaleString()}</span> },
    { key: 'appliedRate', label: 'Avg Rate', render: (row) => <span>₹{row.appliedRate}</span> },
    { key: 'grandTotal', label: 'Total', sortable: true, render: (row) => <span className="font-semibold">{fmt(row.grandTotal)}</span> },
    { key: 'totalPaid', label: 'Paid', render: (row) => <span className="text-emerald-600 font-semibold">{fmt(row.totalPaid)}</span> },
    {
      key: 'outstanding',
      label: 'Outstanding',
      render: (row) => (
        <span className={row.outstanding > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>
          {fmt(row.outstanding)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border', STATUS_COLORS[row.status])}>
          {STATUS_LABELS[row.status]}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl p-1 w-fit">
          {[
            { key: 'orders', label: 'Orders', icon: ShoppingBag, count: store.state.printingOrders.length },
            { key: 'goods', label: 'Goods Catalog', icon: Package, count: goodsList.length },
            { key: 'rates', label: 'Rate Cards', icon: Settings, count: store.state.printingServices.length },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                  tab === t.key ? 'bg-white shadow-sm text-[#171717]' : 'text-[#71717A] hover:text-[#171717]'
                )}
              >
                <Icon size={15} />
                <span>{t.label}</span>
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  tab === t.key ? 'bg-[#E4572E]/10 text-[#E4572E]' : 'bg-[#EFECE6] text-[#71717A]'
                )}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditGood(undefined);
              setShowGoodDrawer(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E4DE] text-[#171717] text-sm font-bold hover:border-[#E4572E]/60 shadow-2xs"
          >
            <Tag size={15} className="text-[#E4572E]" />
            <span>+ Add Good</span>
          </button>
          <button
            onClick={() => {
              setEditingOrder(undefined);
              setInitialOrderGood(undefined);
              setShowOrderDrawer(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-sm"
          >
            <Plus size={16} /> New Printing Order
          </button>
        </div>
      </div>

      {/* 1. ORDERS TAB */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <TransactionTable
            columns={orderColumns}
            rows={store.state.printingOrders}
            actions={['view', 'edit', 'payment', 'delete']}
            onAction={(action, row) => {
              if (action === 'view') setViewingOrder(row);
              if (action === 'edit') {
                setEditingOrder(row);
                setInitialOrderGood(undefined);
                setShowOrderDrawer(true);
              }
              if (action === 'payment') onReceivePayment(row.customerId);
              if (action === 'delete') {
                if (confirm(`Delete ${row.orderNumber}?`)) {
                  store.dispatch({ type: 'DELETE_PRINTING_ORDER', payload: row.id });
                }
              }
            }}
            emptyTitle="No Printing Orders"
            emptyDesc="Create your first printing bill using your Goods Catalog."
            onAdd={() => {
              setEditingOrder(undefined);
              setInitialOrderGood(undefined);
              setShowOrderDrawer(true);
            }}
            addLabel="+ New Printing Order"
          />
        </div>
      )}

      {/* 2. GOODS CATALOG TAB */}
      {tab === 'goods' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {['All', ...GOOD_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGoodCategoryFilter(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                    goodCategoryFilter === cat
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-[#FAF8F5] text-[#52525B] border-[#E8E4DE] hover:border-[#171717]/40'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-[#E8E4DE] rounded-xl bg-[#FAF8F5] px-3 py-1.5">
                <Search size={13} className="text-[#71717A] mr-2" />
                <input
                  value={goodCatalogSearch}
                  onChange={(e) => setGoodCatalogSearch(e.target.value)}
                  placeholder="Search goods..."
                  className="bg-transparent text-xs outline-none w-36"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditGood(undefined);
                  setShowGoodDrawer(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E4572E] text-white text-xs font-bold hover:bg-[#D4431B]"
              >
                <Plus size={14} /> Add Good
              </button>
            </div>
          </div>

          {filteredCatalogGoods.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#E8E4DE] rounded-2xl bg-white">
              <Package size={40} className="mx-auto text-[#D8D5CF] mb-3" />
              <p className="font-semibold text-[#52525B]">No Goods Added Yet</p>
              <p className="text-sm text-[#71717A] mt-1">
                Add items like Front Print (₹30), Back Print (₹30), or Front &amp; Back Set (₹60).
              </p>
              <button
                onClick={() => {
                  setEditGood(undefined);
                  setShowGoodDrawer(true);
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#E4572E] text-white text-sm font-bold"
              >
                + Add First Good
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredCatalogGoods.map((good) => (
                <div
                  key={good.id}
                  className={cn(
                    'bg-white border rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-md',
                    good.active ? 'border-[#E8E4DE]' : 'border-dashed border-zinc-300 opacity-75'
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E4DE] text-[#52525B]">
                        {good.category || 'Custom'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditGood(good);
                            setShowGoodDrawer(true);
                          }}
                          className="p-1.5 rounded-lg text-[#52525B] hover:text-[#171717] hover:bg-[#FAF8F5]"
                          title="Edit Good"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${good.name}" from Goods Catalog?`)) {
                              store.dispatch({ type: 'DELETE_PRINTING_GOOD', payload: good.id });
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete Good"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-black text-base text-[#171717] mt-2 leading-tight">
                      {good.name}
                    </h3>
                    {good.description && (
                      <p className="text-xs text-[#71717A] mt-1 line-clamp-2">{good.description}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#F0EDE8] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xl font-black text-[#E4572E] font-mono">₹{good.price}</span>
                      <span className="text-xs font-semibold text-[#71717A]"> / {good.unit || 'pc'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOrder(undefined);
                        setInitialOrderGood(good);
                        setShowOrderDrawer(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#171717] text-white text-[11px] font-bold hover:bg-[#E4572E] transition-colors inline-flex items-center gap-1"
                    >
                      <Sparkles size={11} />
                      <span>Use in Bill</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. RATE CARDS TAB */}
      {tab === 'rates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditService(undefined);
                setShowServiceDrawer(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E4572E] text-white text-sm font-bold hover:bg-[#D4431B] shadow-sm"
            >
              <Plus size={16} /> Add Printing Type
            </button>
          </div>
          {store.state.printingServices.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#E8E4DE] rounded-2xl">
              <Settings size={40} className="mx-auto text-[#D8D5CF] mb-3" />
              <p className="font-semibold text-[#52525B]">No Printing Services Added</p>
              <p className="text-sm text-[#71717A] mt-1">Create your printing rate card first.</p>
              <button
                onClick={() => setShowServiceDrawer(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#E4572E] text-white text-sm font-bold"
              >
                + Add Printing Type
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {store.state.printingServices.map((svc) => (
                <div key={svc.id} className="bg-white border border-[#E8E4DE] rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-[#171717]">{svc.name}</h3>
                      <span
                        className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded-full border mt-1 inline-block',
                          svc.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        )}
                      >
                        {svc.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditService(svc);
                          setShowServiceDrawer(true);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#FAF8F5] border border-[#E8E4DE] hover:border-[#E4572E]/40"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${svc.name}?`)) {
                            store.dispatch({ type: 'DELETE_PRINTING_SERVICE', payload: svc.id });
                          }
                        }}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-[#71717A] text-xs uppercase tracking-wider font-semibold mb-1">Pricing</p>
                    <p className="font-black text-2xl text-[#E4572E]">
                      ₹{svc.baseRate}
                      <span className="text-sm font-semibold text-[#71717A]">
                        {' '}
                        / {svc.pricingMethod.replace(/_/g, ' ')}
                      </span>
                    </p>
                  </div>
                  {svc.slabs.length > 0 && (
                    <div>
                      <p className="text-xs text-[#71717A] font-semibold uppercase tracking-wider mb-1">Quantity Slabs</p>
                      <div className="space-y-0.5">
                        {svc.slabs.map((slab, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-[#52525B]">
                              {slab.minQty}
                              {slab.maxQty ? `–${slab.maxQty}` : '+'} pcs
                            </span>
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
        {showGoodDrawer && (
          <GoodDrawer
            store={store}
            good={editGood}
            onClose={() => {
              setShowGoodDrawer(false);
              setEditGood(undefined);
            }}
          />
        )}
        {showServiceDrawer && (
          <ServiceDrawer
            store={store}
            svc={editService}
            onClose={() => {
              setShowServiceDrawer(false);
              setEditService(undefined);
            }}
          />
        )}
        {showOrderDrawer && (
          <PrintingOrderDrawer
            store={store}
            editOrder={editingOrder}
            initialGood={initialOrderGood}
            onClose={() => {
              setShowOrderDrawer(false);
              setEditingOrder(undefined);
              setInitialOrderGood(undefined);
            }}
            onSaved={() => {
              setShowOrderDrawer(false);
              setEditingOrder(undefined);
              setInitialOrderGood(undefined);
            }}
          />
        )}
        {viewingOrder && (
          <PrintingJobSheetModal
            order={viewingOrder}
            customer={store.state.customers.find((c) => c.id === viewingOrder.customerId)}
            service={store.state.printingServices.find((s) => s.id === viewingOrder.serviceId)}
            onClose={() => setViewingOrder(null)}
            onReceivePayment={onReceivePayment}
            onViewCustomerLedger={onViewCustomerLedger}
            onEditOrder={() => {
              const target = viewingOrder;
              setViewingOrder(null);
              setEditingOrder(target);
              setInitialOrderGood(undefined);
              setShowOrderDrawer(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
