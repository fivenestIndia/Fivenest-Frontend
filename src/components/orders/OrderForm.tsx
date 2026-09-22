import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, AlertCircle, CheckCircle2, Clock, Plus, Sparkles, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react';
import {
  useOrderStore, ManufacturerOrder, Customer, CHEST_SIZES,
  PAYMENT_MODES, PAYMENT_MODE_LABELS, PaymentMode, StageStatus, fmt
} from '../../hooks/useOrderStore';

const cn = (...c: (string|undefined|boolean)[]) => c.filter(Boolean).join(' ');
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d: string, n: number) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

interface Props {
  store: ReturnType<typeof useOrderStore>;
  editOrder?: ManufacturerOrder | null;
  prefillCustomerId?: string;
  onClose: () => void;
  onSaved: () => void;
}

// Preset options for quick selection
const FABRICS = ['N. Net', 'Micro PP', 'Dryfit', 'Dot Knit', 'Spun', 'Poly Spandex', 'Interlock', 'Super Poly'];
const PRINTS = ['Full Sublimation', 'Front Sublimation', 'Vinyl / DTF', 'Screen Print', 'Embroidery + Print'];
const COLLAR_TYPES = ['Ready made', 'Self Fabric', 'V-Neck', 'Round Neck', 'Polo / Rib', 'Chinese Collar'];
const COLLAR_COLORS = ['Black', 'White', 'Navy Blue', 'Red', 'Self / Matching', 'Royal Blue'];
const HAND_COLORS = ['Printed', 'Black', 'White', 'Body Matching', 'Contrast'];
const PIPING_OPTIONS = ['Black', 'White', 'None', 'Contrast Striped', 'Single Stripe'];

export default function OrderForm({ store, editOrder, prefillCustomerId, onClose, onSaved }: Props) {
  // Customer selection
  const [customerId, setCustomerId] = useState(prefillCustomerId || editOrder?.customerId || '');
  const [custSearch, setCustSearch] = useState('');
  const [custDropOpen, setCustDropOpen] = useState(false);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustBusiness, setNewCustBusiness] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Header dates & rates
  const [orderDate, setOrderDate] = useState(editOrder?.orderDate || today());
  const [deliveryDate, setDeliveryDate] = useState(editOrder?.deliveryDate || addDays(today(), 14));
  const [dueDate, setDueDate] = useState(editOrder?.dueDate || addDays(today(), 28));
  const [halfRate, setHalfRate] = useState<number>(editOrder?.halfRate ?? 320);
  const [fullRate, setFullRate] = useState<number>(editOrder?.fullRate ?? 350);

  // 1. ORDER DETAILS
  const [fabric, setFabric] = useState(editOrder?.fabric || 'N. Net');
  const [printDetails, setPrintDetails] = useState(editOrder?.printDetails || 'Full Sublimation');
  const [collarType, setCollarType] = useState(editOrder?.collarType || 'Ready made');
  const [collarColor, setCollarColor] = useState(editOrder?.collarColor || 'Black');
  const [handColor, setHandColor] = useState(editOrder?.handColor || 'Printed');
  const [handStripeOrPiping, setHandStripeOrPiping] = useState(editOrder?.handStripeOrPiping || 'Black');

  // Extra optional jersey fields
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [teamName, setTeamName] = useState(editOrder?.teamName || '');
  const [tournamentName, setTournamentName] = useState(editOrder?.tournamentName || '');
  const [playerNames, setPlayerNames] = useState(editOrder?.playerNames || '');
  const [playerNumbers, setPlayerNumbers] = useState(editOrder?.playerNumbers || '');
  const [specialInstructions, setSpecialInstructions] = useState(editOrder?.specialInstructions || '');

  // 2. ORDER STATUS (4 Stages)
  const [stageStatus, setStageStatus] = useState<StageStatus>(
    editOrder?.stageStatus || {
      design: 'done',
      fabric: 'done',
      print: 'pending',
      stitch: 'pending',
    }
  );

  // 3. QUANTITY DETAILS (Sizing 20–50 in steps of 2)
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, { half: number; full: number }>>(() => {
    if (editOrder?.sizeQuantities) {
      return editOrder.sizeQuantities;
    }
    const initial: Record<string, { half: number; full: number }> = {};
    CHEST_SIZES.forEach(sz => {
      initial[sz] = { half: 0, full: 0 };
    });
    return initial;
  });

  // 4. PAYMENT DETAILS
  const [advance1, setAdvance1] = useState<number>(editOrder?.advance1 ?? (editOrder?.advancePayments?.[0]?.amount || 0));
  const [advMode1, setAdvMode1] = useState<PaymentMode>(editOrder?.advancePayments?.[0]?.mode || 'cash');
  const [advance2, setAdvance2] = useState<number>(editOrder?.advance2 ?? (editOrder?.advancePayments?.[1]?.amount || 0));
  const [advMode2, setAdvMode2] = useState<PaymentMode>(editOrder?.advancePayments?.[1]?.mode || 'upi');
  const [advance3, setAdvance3] = useState<number>(editOrder?.advance3 ?? (editOrder?.advancePayments?.[2]?.amount || 0));
  const [advMode3, setAdvMode3] = useState<PaymentMode>(editOrder?.advancePayments?.[2]?.mode || 'bank');

  // Custom adjustments (optional discount / charges)
  const [discount, setDiscount] = useState<number>(editOrder?.discount || 0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(editOrder?.additionalCharges || 0);
  const [manualTotalOverride, setManualTotalOverride] = useState<boolean>(false);
  const [customGrandTotal, setCustomGrandTotal] = useState<number>(editOrder?.grandTotal || 0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Computed size totals
  const { totalHalfQty, totalFullQty, totalQty } = useMemo(() => {
    let halfSum = 0;
    let fullSum = 0;
    CHEST_SIZES.forEach(sz => {
      const q = sizeQuantities[sz];
      if (q) {
        halfSum += q.half || 0;
        fullSum += q.full || 0;
      }
    });
    return {
      totalHalfQty: halfSum,
      totalFullQty: fullSum,
      totalQty: halfSum + fullSum,
    };
  }, [sizeQuantities]);

  // Computed amounts
  const computedTotal = useMemo(() => {
    const halfAmt = totalHalfQty * (halfRate || 0);
    const fullAmt = totalFullQty * (fullRate || 0);
    return Math.max(0, halfAmt + fullAmt + additionalCharges - discount);
  }, [totalHalfQty, totalFullQty, halfRate, fullRate, additionalCharges, discount]);

  const grandTotal = manualTotalOverride ? customGrandTotal : computedTotal;
  const totalAdvances = (advance1 || 0) + (advance2 || 0) + (advance3 || 0);
  const balanceAmount = Math.max(0, grandTotal - totalAdvances);

  // Customer lookups
  const selectedCustomer = store.state.customers.find(c => c.id === customerId);
  const filteredCustomers = store.state.customers.filter(c =>
    !custSearch ||
    c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.businessName.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone.includes(custSearch)
  );

  // Handle size input change
  const handleSizeChange = (sz: string, type: 'half' | 'full', value: number) => {
    setSizeQuantities(prev => ({
      ...prev,
      [sz]: {
        ...prev[sz],
        [type]: Math.max(0, value || 0),
      },
    }));
  };

  // Quick fill sample data matching the spreadsheet
  const fillSampleData = () => {
    const sample: Record<string, { half: number; full: number }> = {};
    CHEST_SIZES.forEach(sz => {
      sample[sz] = { half: 0, full: 0 };
    });
    sample['32'] = { half: 4, full: 0 };
    sample['34'] = { half: 1, full: 2 };
    sample['36'] = { half: 2, full: 0 };
    sample['38'] = { half: 9, full: 5 };
    sample['40'] = { half: 3, full: 0 };
    sample['42'] = { half: 2, full: 0 };
    setSizeQuantities(sample);
    setAdvance1(3000);
    setAdvance2(3720);
    setFabric('N. Net');
    setPrintDetails('Full Sublimation');
    setCollarType('Ready made');
    setCollarColor('Black');
    setHandColor('Printed');
    setHandStripeOrPiping('Black');
  };

  const clearSizes = () => {
    const empty: Record<string, { half: number; full: number }> = {};
    CHEST_SIZES.forEach(sz => {
      empty[sz] = { half: 0, full: 0 };
    });
    setSizeQuantities(empty);
  };

  // Stage status helper
  const toggleStage = (stage: keyof StageStatus) => {
    const cycle: Record<StageStatus[typeof stage], StageStatus[typeof stage]> = {
      pending: 'in_progress',
      in_progress: 'done',
      done: 'pending',
    };
    setStageStatus(prev => ({ ...prev, [stage]: cycle[prev[stage]] }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerId) e.customer = 'Please select or add a customer';
    if (totalQty === 0) e.qty = 'Please enter at least one size quantity';
    if (!deliveryDate) e.deliveryDate = 'Delivery date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleQuickAddCustomer = () => {
    if (!newCustBusiness.trim() || !newCustPhone.trim()) return;
    const newCust = {
      name: newCustName.trim() || newCustBusiness.trim(),
      businessName: newCustBusiness.trim(),
      phone: newCustPhone.trim(),
      whatsapp: newCustPhone.trim(),
      email: '',
      gstin: '',
      billingAddress: '',
      shippingAddress: '',
      state: '',
      customerType: 'direct' as const,
      openingBalance: 0,
      openingBalanceDate: today(),
      notes: '',
    };
    store.dispatch({ type: 'ADD_CUSTOMER', payload: newCust });
    setTimeout(() => {
      const created = store.state.customers[store.state.customers.length - 1];
      if (created) {
        setCustomerId(created.id);
        setShowQuickCustomer(false);
      }
    }, 40);
  };

  const handleSave = (saveStatus: ManufacturerOrder['status']) => {
    if (!validate()) return;

    const advancePaymentsList = [
      advance1 > 0 ? { amount: advance1, date: orderDate, mode: advMode1, notes: 'Advance 1' } : null,
      advance2 > 0 ? { amount: advance2, date: orderDate, mode: advMode2, notes: 'Advance 2' } : null,
      advance3 > 0 ? { amount: advance3, date: orderDate, mode: advMode3, notes: 'Advance 3' } : null,
    ].filter(Boolean) as Array<{ amount: number; date: string; mode: PaymentMode; notes: string }>;

    // Derive overall status from stages if not explicitly changed
    let effectiveStatus = saveStatus;
    if (stageStatus.stitch === 'done') {
      effectiveStatus = 'ready';
    } else if (stageStatus.design === 'done' || stageStatus.fabric === 'done' || stageStatus.print === 'in_progress') {
      effectiveStatus = 'production';
    }

    const payload = {
      customerId,
      orderDate,
      deliveryDate,
      dueDate,
      priority: 'normal' as const,
      status: effectiveStatus,
      paymentStatus: balanceAmount === 0 && grandTotal > 0 ? 'paid' : totalAdvances > 0 ? 'partial' : 'unpaid',

      // Factory Job Sheet details
      halfRate,
      fullRate,
      fabric,
      printDetails,
      collarType,
      collarColor,
      handColor,
      handStripeOrPiping,

      // Stages
      stageStatus,

      // Sizing
      sizeQuantities,
      totalHalfQty,
      totalFullQty,
      totalQty,

      // Advances & Balance
      advancePayments: advancePaymentsList,
      advance1,
      advance2,
      advance3,
      balanceAmount,

      // Optional extra fields
      teamName: teamName || selectedCustomer?.businessName || '',
      tournamentName,
      playerNames,
      playerNumbers,
      sponsor: '',
      sleeveType: totalFullQty > 0 && totalHalfQty > 0 ? 'Half & Full' : totalFullQty > 0 ? 'Full' : 'Half',
      jerseyType: 'Jersey',
      shortsRequired: false,
      sublimation: printDetails.toLowerCase().includes('sublimation'),
      embroidery: false,
      printing: true,
      packaging: true,
      specialInstructions,
      referenceDesign: '',

      // Pricing
      itemsTotal: (totalHalfQty * halfRate) + (totalFullQty * fullRate),
      printingCharges: 0,
      packagingCharges: 0,
      additionalCharges,
      discount,
      gstPct: 0,
      gstAmount: 0,
      shipping: 0,
      roundOff: 0,
      grandTotal,
      totalPaid: totalAdvances,
      outstanding: balanceAmount,
      notes: specialInstructions,
    };

    if (editOrder) {
      store.dispatch({ type: 'UPDATE_MFG_ORDER', payload: { ...editOrder, ...payload } });
    } else {
      store.dispatch({ type: 'ADD_MFG_ORDER', payload });
      // If advances were entered, record them as payments in store
      if (totalAdvances > 0) {
        setTimeout(() => {
          const newOrder = store.state.manufacturerOrders[store.state.manufacturerOrders.length - 1];
          if (newOrder) {
            advancePaymentsList.forEach((adv, idx) => {
              store.dispatch({
                type: 'ADD_PAYMENT',
                payload: {
                  customerId,
                  date: adv.date,
                  amount: adv.amount,
                  mode: adv.mode,
                  referenceNumber: `ADV-${idx + 1}`,
                  notes: `${adv.notes} for Order ${newOrder.orderNumber}`,
                  receivedBy: 'Admin',
                  allocations: [{ orderId: newOrder.id, orderType: 'manufacturer', amount: adv.amount }],
                },
              });
            });
          }
        }, 50);
      }
    }

    onSaved();
  };

  return (
    <>
      {/* Modal backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Main Drawer Modal */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-5xl bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] bg-[#FAF8F5] shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#E4572E] flex items-center justify-center text-white font-black text-sm">
              M
            </span>
            <div>
              <h2 className="text-lg font-black text-[#171717]">
                {editOrder ? `Edit ${editOrder.orderNumber}` : 'New Manufacturing Order & Job Sheet'}
              </h2>
              <p className="text-xs text-[#71717A]">
                Sportswear & Jersey Production Specification Sheet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fillSampleData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors"
              title="Pre-fill with sample spreadsheet values"
            >
              <Sparkles size={13} /> Fill Sample Data
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F0EDE8] transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ── TOP HEADER SECTION: Customer, Order No, Delivery Date, Rates ── */}
          <div className="bg-[#FAF8F5] border border-[#E8E4DE] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Customer Selector (Span 6) */}
              <div className="md:col-span-6 relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#52525B]">
                    CUSTOMER NAME *
                  </label>
                  <button
                    onClick={() => setShowQuickCustomer(!showQuickCustomer)}
                    className="text-xs font-bold text-[#E4572E] hover:underline"
                  >
                    + Add New Customer
                  </button>
                </div>

                {!showQuickCustomer ? (
                  <div className="relative">
                    <div className="flex items-center border border-[#E8E4DE] rounded-xl overflow-hidden focus-within:border-[#E4572E] bg-white">
                      <Search size={15} className="ml-3 text-[#71717A] shrink-0" />
                      <input
                        value={selectedCustomer ? selectedCustomer.businessName : custSearch}
                        onChange={e => {
                          setCustSearch(e.target.value);
                          setCustomerId('');
                          setCustDropOpen(true);
                        }}
                        onFocus={() => setCustDropOpen(true)}
                        placeholder="Search customer name or phone..."
                        className="flex-1 px-3 py-2 text-sm outline-none font-semibold text-[#171717]"
                      />
                      {customerId && (
                        <button onClick={() => { setCustomerId(''); setCustSearch(''); }} className="mr-2">
                          <X size={14} className="text-[#71717A]" />
                        </button>
                      )}
                    </div>

                    {/* Customer Dropdown */}
                    <AnimatePresence>
                      {custDropOpen && !customerId && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E8E4DE] rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto"
                        >
                          {filteredCustomers.length === 0 ? (
                            <div className="p-3 text-center text-xs text-[#71717A]">
                              No customer found.{' '}
                              <button
                                onClick={() => setShowQuickCustomer(true)}
                                className="text-[#E4572E] font-bold underline"
                              >
                                Create now
                              </button>
                            </div>
                          ) : (
                            filteredCustomers.map(c => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setCustomerId(c.id);
                                  setCustDropOpen(false);
                                  setCustSearch('');
                                }}
                                className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-[#FAF8F5] text-left border-b border-[#F0EDE8] last:border-0"
                              >
                                <div>
                                  <p className="text-sm font-bold text-[#171717]">{c.businessName}</p>
                                  <p className="text-xs text-[#71717A]">{c.name} · {c.phone}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-xl border border-[#E8E4DE] space-y-2">
                    <input
                      placeholder="Business / Group Name (e.g. Vakratunda Group)"
                      value={newCustBusiness}
                      onChange={e => setNewCustBusiness(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E4DE] outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Contact Person"
                        value={newCustName}
                        onChange={e => setNewCustName(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E4DE] outline-none"
                      />
                      <input
                        placeholder="Phone / WhatsApp"
                        value={newCustPhone}
                        onChange={e => setNewCustPhone(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E4DE] outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowQuickCustomer(false)}
                        className="px-2.5 py-1 text-xs text-[#71717A]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleQuickAddCustomer}
                        className="px-3 py-1 bg-[#E4572E] text-white text-xs font-bold rounded-lg"
                      >
                        Save Customer
                      </button>
                    </div>
                  </div>
                )}
                {errors.customer && <p className="text-red-500 text-xs mt-1">{errors.customer}</p>}
              </div>

              {/* Delivery Date (Span 3) */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1 block">
                  Delivery Date *
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm bg-white font-semibold outline-none focus:border-[#E4572E]"
                />
              </div>

              {/* Order Date (Span 3) */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#52525B] mb-1 block">
                  Order Date
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={e => setOrderDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm bg-white outline-none focus:border-[#E4572E]"
                />
              </div>

            </div>

            {/* Rates Row (Half Sleeve Rate & Full Sleeve Rate) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-[#E8E4DE]">
              <div className="bg-white p-3 rounded-xl border border-[#E8E4DE]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] block mb-1">
                  Half Sleeve Rate (₹)
                </label>
                <div className="flex items-center">
                  <span className="text-gray-400 font-bold mr-1">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={halfRate || ''}
                    onChange={e => setHalfRate(parseFloat(e.target.value) || 0)}
                    className="w-full font-black text-lg outline-none text-[#171717]"
                    placeholder="320"
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#E8E4DE]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] block mb-1">
                  Full Sleeve Rate (₹)
                </label>
                <div className="flex items-center">
                  <span className="text-gray-400 font-bold mr-1">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={fullRate || ''}
                    onChange={e => setFullRate(parseFloat(e.target.value) || 0)}
                    className="w-full font-black text-lg outline-none text-[#171717]"
                    placeholder="350"
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#E8E4DE]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] block mb-1">
                  Total Half Qty
                </label>
                <div className="text-lg font-black text-blue-700">
                  {totalHalfQty} pcs
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#E8E4DE]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] block mb-1">
                  Total Full Qty
                </label>
                <div className="text-lg font-black text-purple-700">
                  {totalFullQty} pcs
                </div>
              </div>
            </div>
          </div>

          {/* ── MAIN 2-COLUMN LAYOUT: (Left: Specs + Status + Payments | Right: Sizing Grid) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ── LEFT COLUMN (Span 6) ── */}
            <div className="lg:col-span-6 space-y-6">

              {/* 1. ORDER DETAILS (Fabric & Specs) */}
              <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E8E4DE] pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#171717] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-[10px]">1</span>
                    ORDER DETAILS
                  </h3>
                  <span className="text-[11px] text-[#71717A]">Fabric, Print, Collar & Sleeves</span>
                </div>

                {/* Fabric */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-[#52525B]">1. Fabric</label>
                    <span className="text-[10px] text-[#71717A]">e.g. N. Net, Micro PP, Dryfit</span>
                  </div>
                  <input
                    value={fabric}
                    onChange={e => setFabric(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#171717] outline-none focus:border-[#E4572E]"
                    placeholder="Enter fabric name (e.g. N. Net)"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {FABRICS.map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFabric(f)}
                        className={cn(
                          'px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors',
                          fabric === f ? 'bg-[#E4572E] text-white border-[#E4572E]' : 'bg-[#FAF8F5] text-[#52525B] border-[#E8E4DE] hover:border-[#E4572E]/40'
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Print Details */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-[#52525B]">2. Print Details</label>
                    <span className="text-[10px] text-[#71717A]">e.g. Full Sublimation</span>
                  </div>
                  <input
                    value={printDetails}
                    onChange={e => setPrintDetails(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#171717] outline-none focus:border-[#E4572E]"
                    placeholder="Enter print details"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {PRINTS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPrintDetails(p)}
                        className={cn(
                          'px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors',
                          printDetails === p ? 'bg-[#E4572E] text-white border-[#E4572E]' : 'bg-[#FAF8F5] text-[#52525B] border-[#E8E4DE] hover:border-[#E4572E]/40'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collar Type & Collar Color (2 Cols) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#52525B] block mb-1">3. Collar Type</label>
                    <input
                      value={collarType}
                      onChange={e => setCollarType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-xs font-semibold outline-none focus:border-[#E4572E]"
                      placeholder="e.g. Ready made"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {COLLAR_TYPES.slice(0, 4).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCollarType(c)}
                          className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold border', collarType === c ? 'bg-[#171717] text-white' : 'bg-gray-50 text-gray-700')}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#52525B] block mb-1">4. Collar Color</label>
                    <input
                      value={collarColor}
                      onChange={e => setCollarColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-xs font-semibold outline-none focus:border-[#E4572E]"
                      placeholder="e.g. Black"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {COLLAR_COLORS.slice(0, 4).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCollarColor(c)}
                          className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold border', collarColor === c ? 'bg-[#171717] text-white' : 'bg-gray-50 text-gray-700')}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hand Color & Hand Stripe or Piping (2 Cols) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#52525B] block mb-1">5. Hand Color</label>
                    <input
                      value={handColor}
                      onChange={e => setHandColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-xs font-semibold outline-none focus:border-[#E4572E]"
                      placeholder="e.g. Printed"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {HAND_COLORS.slice(0, 4).map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setHandColor(h)}
                          className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold border', handColor === h ? 'bg-[#171717] text-white' : 'bg-gray-50 text-gray-700')}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#52525B] block mb-1">6. Hand Stripe / Piping</label>
                    <input
                      value={handStripeOrPiping}
                      onChange={e => setHandStripeOrPiping(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] text-xs font-semibold outline-none focus:border-[#E4572E]"
                      placeholder="e.g. Black"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {PIPING_OPTIONS.slice(0, 4).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setHandStripeOrPiping(p)}
                          className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold border', handStripeOrPiping === p ? 'bg-[#171717] text-white' : 'bg-gray-50 text-gray-700')}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optional Collapsible Extra Fields */}
                <div className="pt-2 border-t border-[#E8E4DE]">
                  <button
                    type="button"
                    onClick={() => setShowExtraDetails(!showExtraDetails)}
                    className="flex items-center justify-between w-full text-xs font-bold text-[#71717A] hover:text-[#171717]"
                  >
                    <span>Additional Details (Team, Tournament, Player Names)</span>
                    {showExtraDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showExtraDetails && (
                    <div className="pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          placeholder="Team / Group Name"
                          value={teamName}
                          onChange={e => setTeamName(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E4DE]"
                        />
                        <input
                          placeholder="Tournament Name"
                          value={tournamentName}
                          onChange={e => setTournamentName(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E4DE]"
                        />
                      </div>
                      <textarea
                        placeholder="Player Names & Numbers (e.g. 1. Sharma 2. Khan)"
                        value={playerNames}
                        onChange={e => setPlayerNames(e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E4DE] resize-none"
                      />
                      <input
                        placeholder="Special Instructions"
                        value={specialInstructions}
                        onChange={e => setSpecialInstructions(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E4DE]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 2. ORDER STATUS (Manufacturing Pipeline Steps) */}
              <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E8E4DE] pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#171717] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-[10px]">2</span>
                    ORDER STATUS
                  </h3>
                  <span className="text-[11px] text-[#71717A]">Click to toggle Done / In Progress / Pending</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['design', 'fabric', 'print', 'stitch'] as Array<keyof StageStatus>).map(st => {
                    const status = stageStatus[st];
                    const cfg = {
                      done: { label: 'Done', bg: 'bg-emerald-50 border-emerald-300 text-emerald-800', icon: CheckCircle2 },
                      in_progress: { label: 'In Progress', bg: 'bg-blue-50 border-blue-300 text-blue-800', icon: Clock },
                      pending: { label: 'Pending', bg: 'bg-amber-50 border-amber-300 text-amber-800', icon: Clock },
                    }[status];
                    const Icon = cfg.icon;

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => toggleStage(st)}
                        className={cn(
                          'p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center',
                          cfg.bg
                        )}
                      >
                        <span className="text-[11px] font-black uppercase tracking-wider capitalize text-gray-700 mb-1">
                          {st}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-black">
                          <Icon size={12} /> {cfg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. PAYMENT DETAILS */}
              <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E8E4DE] pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#171717] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-[10px]">3</span>
                    PAYMENT DETAILS
                  </h3>
                  <span className="text-[11px] text-[#71717A]">Advance Installments & Balance</span>
                </div>

                {/* Advance 1 */}
                <div className="flex items-center gap-3">
                  <div className="w-40 text-xs font-bold text-[#52525B]">Advance payment 1</div>
                  <div className="flex-1 flex items-center border border-[#E8E4DE] rounded-xl overflow-hidden bg-white">
                    <span className="px-2 text-gray-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={advance1 || ''}
                      onChange={e => setAdvance1(parseFloat(e.target.value) || 0)}
                      className="flex-1 py-1.5 text-xs font-black outline-none"
                      placeholder="e.g. 3000"
                    />
                  </div>
                  <select
                    value={advMode1}
                    onChange={e => setAdvMode1(e.target.value as PaymentMode)}
                    className="px-2 py-1.5 text-xs border border-[#E8E4DE] rounded-xl bg-gray-50"
                  >
                    {PAYMENT_MODES.map(m => (
                      <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>
                    ))}
                  </select>
                </div>

                {/* Advance 2 */}
                <div className="flex items-center gap-3">
                  <div className="w-40 text-xs font-bold text-[#52525B]">Advance payment 2</div>
                  <div className="flex-1 flex items-center border border-[#E8E4DE] rounded-xl overflow-hidden bg-white">
                    <span className="px-2 text-gray-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={advance2 || ''}
                      onChange={e => setAdvance2(parseFloat(e.target.value) || 0)}
                      className="flex-1 py-1.5 text-xs font-black outline-none"
                      placeholder="e.g. 3720"
                    />
                  </div>
                  <select
                    value={advMode2}
                    onChange={e => setAdvMode2(e.target.value as PaymentMode)}
                    className="px-2 py-1.5 text-xs border border-[#E8E4DE] rounded-xl bg-gray-50"
                  >
                    {PAYMENT_MODES.map(m => (
                      <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>
                    ))}
                  </select>
                </div>

                {/* Advance 3 */}
                <div className="flex items-center gap-3">
                  <div className="w-40 text-xs font-bold text-[#52525B]">Advance payment 3</div>
                  <div className="flex-1 flex items-center border border-[#E8E4DE] rounded-xl overflow-hidden bg-white">
                    <span className="px-2 text-gray-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={advance3 || ''}
                      onChange={e => setAdvance3(parseFloat(e.target.value) || 0)}
                      className="flex-1 py-1.5 text-xs font-black outline-none"
                      placeholder="0"
                    />
                  </div>
                  <select
                    value={advMode3}
                    onChange={e => setAdvMode3(e.target.value as PaymentMode)}
                    className="px-2 py-1.5 text-xs border border-[#E8E4DE] rounded-xl bg-gray-50"
                  >
                    {PAYMENT_MODES.map(m => (
                      <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>
                    ))}
                  </select>
                </div>

                {/* Total & Balance Display Box */}
                <div className="p-4 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#52525B]">Calculated from Sizing</span>
                    <span className="font-semibold text-[#171717]">{fmt(computedTotal)}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-[#E8E4DE] pt-2">
                    <span className="text-sm font-black text-[#171717] uppercase tracking-wider">
                      TOTAL AMOUNT
                    </span>
                    {!manualTotalOverride ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#171717]">{fmt(grandTotal)}</span>
                        <button
                          type="button"
                          onClick={() => { setManualTotalOverride(true); setCustomGrandTotal(computedTotal); }}
                          className="text-[10px] text-[#E4572E] font-bold hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={customGrandTotal}
                          onChange={e => setCustomGrandTotal(parseFloat(e.target.value) || 0)}
                          className="w-28 px-2 py-1 text-sm font-black text-right border border-[#E4572E] rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setManualTotalOverride(false)}
                          className="text-[10px] text-gray-500 hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-emerald-700">Total Advance Paid</span>
                    <span className="font-black text-emerald-700">{fmt(totalAdvances)}</span>
                  </div>

                  <div className="flex justify-between items-center border-t-2 border-black/10 pt-2">
                    <span className="text-sm font-black text-[#171717] uppercase tracking-wider">
                      Balance Amount
                    </span>
                    <span className={cn('text-xl font-black', balanceAmount > 0 ? 'text-red-600' : 'text-emerald-700')}>
                      {fmt(balanceAmount)}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* ── RIGHT COLUMN: QUANTITY DETAILS (Sizing 20–50 Table) (Span 6) ── */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="bg-white border border-[#E8E4DE] rounded-2xl p-5 shadow-sm flex-1 flex flex-col">
                
                <div className="flex items-center justify-between border-b border-[#E8E4DE] pb-2 mb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#171717] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#E4572E] text-white flex items-center justify-center text-[10px]">4</span>
                      Quantity Details (Sizing 20–50)
                    </h3>
                    <p className="text-[11px] text-[#71717A]">
                      Enter Half Sleeve & Full Sleeve quantities
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSizes}
                    className="text-[11px] text-gray-400 hover:text-red-600 font-semibold"
                  >
                    Clear Sizing
                  </button>
                </div>

                {errors.qty && (
                  <p className="text-red-500 text-xs mb-2 flex items-center gap-1">
                    <AlertCircle size={13} /> {errors.qty}
                  </p>
                )}

                {/* Sizing Table */}
                <div className="border border-black/80 rounded-xl overflow-hidden flex-1 flex flex-col">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 bg-gray-100 border-b border-black/80 text-center font-black text-xs py-2 text-gray-800">
                    <div className="col-span-3 border-r border-black/60">Size</div>
                    <div className="col-span-4 border-r border-black/60">Half Sleeve</div>
                    <div className="col-span-4 border-r border-black/60">Full Sleeve</div>
                    <div className="col-span-1">Total</div>
                  </div>

                  {/* Size Rows (20 to 50) */}
                  <div className="flex-1 divide-y divide-gray-200 overflow-y-auto max-h-[500px]">
                    {CHEST_SIZES.map(sz => {
                      const q = sizeQuantities[sz] || { half: 0, full: 0 };
                      const rowTotal = (q.half || 0) + (q.full || 0);
                      const hasQty = rowTotal > 0;

                      return (
                        <div
                          key={sz}
                          className={cn(
                            'grid grid-cols-12 items-center text-center text-xs py-1 transition-colors',
                            hasQty ? 'bg-amber-50/70 font-bold' : 'hover:bg-gray-50'
                          )}
                        >
                          {/* Size label */}
                          <div className="col-span-3 border-r border-gray-200 font-black text-gray-900 text-sm">
                            {sz}
                          </div>

                          {/* Half sleeve input */}
                          <div className="col-span-4 border-r border-gray-200 px-2">
                            <input
                              type="number"
                              min="0"
                              value={q.half > 0 ? q.half : ''}
                              onChange={e => handleSizeChange(sz, 'half', parseInt(e.target.value) || 0)}
                              placeholder="—"
                              className="w-full text-center py-1 rounded-lg font-bold text-sm bg-transparent focus:bg-white focus:ring-1 focus:ring-[#E4572E] outline-none"
                            />
                          </div>

                          {/* Full sleeve input */}
                          <div className="col-span-4 border-r border-gray-200 px-2">
                            <input
                              type="number"
                              min="0"
                              value={q.full > 0 ? q.full : ''}
                              onChange={e => handleSizeChange(sz, 'full', parseInt(e.target.value) || 0)}
                              placeholder="—"
                              className="w-full text-center py-1 rounded-lg font-bold text-sm bg-transparent focus:bg-white focus:ring-1 focus:ring-[#E4572E] outline-none"
                            />
                          </div>

                          {/* Row Total */}
                          <div className="col-span-1 text-center font-black text-gray-800">
                            {rowTotal > 0 ? rowTotal : '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sizing Footer Totals */}
                  <div className="border-t-2 border-black/80 bg-gray-100 font-black text-xs">
                    <div className="grid grid-cols-12 py-2 border-b border-gray-300 text-center">
                      <div className="col-span-3 border-r border-gray-300 uppercase tracking-wider">
                        Total
                      </div>
                      <div className="col-span-4 border-r border-gray-300 text-blue-700 text-sm">
                        {totalHalfQty}
                      </div>
                      <div className="col-span-4 border-r border-gray-300 text-purple-700 text-sm">
                        {totalFullQty}
                      </div>
                      <div className="col-span-1 text-gray-900 text-sm">
                        {totalQty}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-200 flex items-center justify-between">
                      <span className="uppercase tracking-wider text-xs font-black text-gray-800">
                        Grand Total Quantity
                      </span>
                      <span className="text-xl font-black text-[#E4572E]">
                        {totalQty} pcs
                      </span>
                    </div>
                  </div>

                </div>

                {/* Subtotal calculation breakdown */}
                <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#E8E4DE] rounded-xl text-xs space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Half Sleeve: {totalHalfQty} pcs × ₹{halfRate}</span>
                    <span className="font-bold text-gray-900">{fmt(totalHalfQty * halfRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Full Sleeve: {totalFullQty} pcs × ₹{fullRate}</span>
                    <span className="font-bold text-gray-900">{fmt(totalFullQty * fullRate)}</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ── STICKY FOOTER BAR ── */}
        <div className="px-6 py-4 border-t border-[#E8E4DE] bg-[#FAF8F5] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-[#71717A] uppercase text-[10px] block font-bold">Total Qty</span>
              <span className="font-black text-[#171717]">{totalQty} pcs</span>
            </div>
            <div className="h-6 w-px bg-[#E8E4DE]" />
            <div>
              <span className="text-[#71717A] uppercase text-[10px] block font-bold">Total Amount</span>
              <span className="font-black text-[#171717]">{fmt(grandTotal)}</span>
            </div>
            <div className="h-6 w-px bg-[#E8E4DE]" />
            <div>
              <span className="text-[#71717A] uppercase text-[10px] block font-bold">Balance Due</span>
              <span className={cn('font-black', balanceAmount > 0 ? 'text-red-600' : 'text-emerald-700')}>
                {fmt(balanceAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8E4DE] text-sm font-semibold text-[#52525B] hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="px-4 py-2.5 rounded-xl border border-[#E8E4DE] text-sm font-bold text-[#171717] hover:bg-white transition-colors hidden sm:block"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave('confirmed')}
              className="px-6 py-2.5 rounded-xl bg-[#E4572E] text-white text-sm font-bold hover:bg-[#D4431B] shadow-md transition-all"
            >
              {editOrder ? 'Update Order' : 'Save & Confirm Order'}
            </button>
          </div>
        </div>

      </motion.div>
    </>
  );
}
